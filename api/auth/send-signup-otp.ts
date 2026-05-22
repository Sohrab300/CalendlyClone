import { createSupabaseAdminClient } from "../../server/supabaseAdmin";
import { OtpServiceError, sendOtp } from "../../server/otpService";

const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = getBody(req.body) as { email?: string };
    if (!body.email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    await sendOtp(supabaseAdmin, body.email);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error sending signup OTP:", error);

    if (error instanceof OtpServiceError) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to send verification code",
    });
  }
}
