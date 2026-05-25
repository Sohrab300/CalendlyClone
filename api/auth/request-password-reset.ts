import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { captureServerError } from "../../server/sentry";

const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

const getAppOrigin = (req: any) => {
  const configuredUrl = process.env.VITE_PUBLIC_APP_URL?.trim();
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      // Fall back to request headers below.
    }
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  return `${protocol}://${host}`;
};

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = getBody(req.body) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return sendJson(res, 400, { error: "Email is required" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();

    if (!supabaseUrl || !supabaseServiceKey || !emailUser || !emailPass) {
      await captureServerError(new Error("Password reset configuration missing"), {
        route: "/api/auth/request-password-reset",
        stage: "configuration",
        email,
      });
      return sendJson(res, 500, { error: "Password reset is not configured" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name")
      .ilike("email", email)
      .maybeSingle();

    if (profileError) {
      await captureServerError(profileError, {
        route: "/api/auth/request-password-reset",
        stage: "profile_lookup",
        email,
      });
      return sendJson(res, 500, { error: "Failed to verify user" });
    }

    if (!profile) {
      return sendJson(res, 404, { error: "User doesn't exist" });
    }

    const token = `pwd_${randomBytes(32).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: deleteError } = await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email);

    if (deleteError) {
      await captureServerError(deleteError, {
        route: "/api/auth/request-password-reset",
        stage: "delete_existing_token",
        email,
      });
      return sendJson(res, 500, { error: "Failed to create reset link" });
    }

    const { error: insertError } = await supabaseAdmin
      .from("verification_codes")
      .insert([{ email, code: token, expires_at: expiresAt }]);

    if (insertError) {
      await captureServerError(insertError, {
        route: "/api/auth/request-password-reset",
        stage: "insert_reset_token",
        email,
      });
      return sendJson(res, 500, { error: "Failed to create reset link" });
    }

    const resetUrl = `${getAppOrigin(req)}/reset-password?email=${encodeURIComponent(
      email,
    )}&token=${encodeURIComponent(token)}`;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"DevSchedule" <${emailUser}>`,
      to: email,
      subject: "Reset your DevSchedule password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">Reset your password</h1>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #475569;">
            Use the button below to create a new password for your DevSchedule account.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #006bff; color: #ffffff; text-decoration: none; font-weight: 700; padding: 14px 22px; border-radius: 10px;">Reset password</a>
          <p style="font-size: 13px; color: #64748b; margin: 24px 0 0;">
            This link is valid for 5 minutes only. If you did not request it, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("[request-password-reset] Failed", error);
    await captureServerError(error, {
      route: "/api/auth/request-password-reset",
      stage: "unhandled",
    });
    return sendJson(res, 500, { error: "Failed to send password reset link" });
  }
}
