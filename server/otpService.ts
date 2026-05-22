import { sendOtpEmail } from "./emailService";

export class OtpServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = "OtpServiceError";
    this.statusCode = statusCode;
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const sendOtp = async (supabaseAdmin: any, email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  const { error: deleteError } = await supabaseAdmin
    .from("verification_codes")
    .delete()
    .eq("email", normalizedEmail);

  if (deleteError) {
    throw new OtpServiceError("Failed to reset verification code");
  }

  const { error: dbError } = await supabaseAdmin
    .from("verification_codes")
    .insert([{ email: normalizedEmail, code, expires_at: expires.toISOString() }]);

  if (dbError) {
    throw new OtpServiceError("Failed to store verification code");
  }

  try {
    await sendOtpEmail(normalizedEmail, code);
  } catch (error) {
    throw new OtpServiceError("Failed to send verification email");
  }
};

export const verifyOtp = async (
  supabaseAdmin: any,
  email: string,
  code: string,
) => {
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabaseAdmin
    .from("verification_codes")
    .select("*")
    .eq("email", normalizedEmail)
    .eq("code", code)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new OtpServiceError("Invalid verification code", 400);
  }

  if (new Date() > new Date(data.expires_at)) {
    throw new OtpServiceError("Verification code has expired", 400);
  }

  const { error: deleteError } = await supabaseAdmin
    .from("verification_codes")
    .delete()
    .eq("email", normalizedEmail);

  if (deleteError) {
    throw new OtpServiceError("Failed to complete verification");
  }
};
