import { sendOtpEmail } from "./emailService";
import { getErrorDetails, maskEmail } from "./logging";

export class OtpServiceError extends Error {
  statusCode: number;
  diagnosticCode: string;

  constructor(message: string, statusCode = 500, diagnosticCode = "otp_failed") {
    super(message);
    this.name = "OtpServiceError";
    this.statusCode = statusCode;
    this.diagnosticCode = diagnosticCode;
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const sendOtp = async (
  supabaseAdmin: any,
  email: string,
  requestId = "unknown",
) => {
  const normalizedEmail = normalizeEmail(email);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  console.info("[OTP] Send started", {
    requestId,
    email: maskEmail(normalizedEmail),
    expiresAt: expires.toISOString(),
  });

  const { error: deleteError } = await supabaseAdmin
    .from("verification_codes")
    .delete()
    .eq("email", normalizedEmail);

  if (deleteError) {
    console.error("[OTP] Failed deleting existing verification codes", {
      requestId,
      email: maskEmail(normalizedEmail),
      error: deleteError,
    });
    throw new OtpServiceError(
      "Failed to reset verification code",
      500,
      "db_delete_failed",
    );
  }

  console.info("[OTP] Existing verification codes deleted", {
    requestId,
    email: maskEmail(normalizedEmail),
  });

  const { error: dbError } = await supabaseAdmin
    .from("verification_codes")
    .insert([{ email: normalizedEmail, code, expires_at: expires.toISOString() }]);

  if (dbError) {
    console.error("[OTP] Failed saving verification code", {
      requestId,
      email: maskEmail(normalizedEmail),
      error: dbError,
    });
    throw new OtpServiceError(
      "Failed to store verification code",
      500,
      "db_insert_failed",
    );
  }

  console.info("[OTP] Verification code saved", {
    requestId,
    email: maskEmail(normalizedEmail),
  });

  try {
    await sendOtpEmail(normalizedEmail, code);
  } catch (error) {
    console.error("[OTP] Email send failed after code was saved", {
      requestId,
      email: maskEmail(normalizedEmail),
      error: getErrorDetails(error),
    });
    throw new OtpServiceError(
      "Failed to send verification email",
      500,
      "email_send_failed",
    );
  }

  console.info("[OTP] Send completed", {
    requestId,
    email: maskEmail(normalizedEmail),
  });
};

export const verifyOtp = async (
  supabaseAdmin: any,
  email: string,
  code: string,
  requestId = "unknown",
) => {
  const normalizedEmail = normalizeEmail(email);

  console.info("[OTP] Verify started", {
    requestId,
    email: maskEmail(normalizedEmail),
    codeLength: code.length,
  });

  const { data, error } = await supabaseAdmin
    .from("verification_codes")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.warn("[OTP] Verification code not found", {
      requestId,
      email: maskEmail(normalizedEmail),
      error,
    });
    throw new OtpServiceError(
      "Invalid verification code",
      400,
      "otp_not_found",
    );
  }

  if (new Date() > new Date(data.expires_at)) {
    console.warn("[OTP] Verification code expired", {
      requestId,
      email: maskEmail(normalizedEmail),
      expiresAt: data.expires_at,
    });
    throw new OtpServiceError(
      "Verification code has expired",
      400,
      "otp_expired",
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("verification_codes")
    .delete()
    .eq("email", normalizedEmail);

  if (deleteError) {
    console.error("[OTP] Failed deleting verified code", {
      requestId,
      email: maskEmail(normalizedEmail),
      error: deleteError,
    });
    throw new OtpServiceError(
      "Failed to complete verification",
      500,
      "db_verified_delete_failed",
    );
  }

  console.info("[OTP] Verify completed", {
    requestId,
    email: maskEmail(normalizedEmail),
  });
};
