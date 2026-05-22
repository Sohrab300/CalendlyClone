import { createSupabaseAdminClient } from "../../server/supabaseAdmin";
import { OtpServiceError, verifyOtp } from "../../server/otpService";
import { getErrorDetails, maskEmail } from "../../server/logging";

const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

export default async function handler(req: any, res: any) {
  const requestId =
    req.headers?.["x-vercel-id"] ||
    req.headers?.["x-request-id"] ||
    crypto.randomUUID();

  console.info("[API verify-signup-otp] Request received", {
    requestId,
    method: req.method,
  });

  if (req.method !== "POST") {
    console.warn("[API verify-signup-otp] Method not allowed", {
      requestId,
      method: req.method,
    });
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = getBody(req.body) as { email?: string; code?: string };
    if (!body.email || !body.code) {
      console.warn("[API verify-signup-otp] Missing email or code", {
        requestId,
        hasEmail: Boolean(body.email),
        hasCode: Boolean(body.code),
      });
      return res.status(400).json({ error: "Email and code are required" });
    }

    console.info("[API verify-signup-otp] Creating Supabase client", {
      requestId,
      email: maskEmail(body.email),
      codeLength: body.code.length,
    });

    const supabaseAdmin = createSupabaseAdminClient();
    await verifyOtp(supabaseAdmin, body.email, body.code, requestId);

    console.info("[API verify-signup-otp] Request completed", {
      requestId,
      email: maskEmail(body.email),
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[API verify-signup-otp] Request failed", {
      requestId,
      error: getErrorDetails(error),
    });

    if (error instanceof OtpServiceError) {
      return res.status(error.statusCode).json({
        error: error.message,
        diagnosticCode: error.diagnosticCode,
        requestId,
      });
    }

    return res.status(500).json({
      error: "Verification failed",
      diagnosticCode:
        error instanceof Error &&
        error.message.includes("SUPABASE_SERVICE_ROLE_KEY")
          ? "server_env_missing"
          : "unexpected_server_error",
      requestId,
    });
  }
}
