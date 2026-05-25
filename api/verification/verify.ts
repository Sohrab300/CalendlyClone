import { createClient } from "@supabase/supabase-js";
import { OtpServiceError, verifyOtp } from "../../server/otpService";

const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const body = getBody(req.body) as { email?: string; code?: string };
  const email = body.email?.trim();
  const code = body.code?.trim();

  if (!email || !code) {
    return sendJson(res, 400, { error: "Email and code are required" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !supabaseServiceKey) {
    return sendJson(res, 500, { error: "Verification failed" });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    await verifyOtp(supabaseAdmin, email, code);
    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("Verification error:", error);

    if (error instanceof OtpServiceError) {
      return sendJson(res, error.statusCode, { error: error.message });
    }

    return sendJson(res, 500, { error: "Verification failed" });
  }
}
