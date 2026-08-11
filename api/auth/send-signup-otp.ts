import { captureServerError } from "../../server/sentry.js";

const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, {
        error: "Method not allowed",
      });
    }

    const body = getBody(req.body) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return sendJson(res, 400, {
        error: "Email is required",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();

    if (!supabaseUrl || !supabaseKey) {
      await captureServerError(new Error("Missing Supabase configuration"), {
        route: "/api/auth/send-signup-otp",
        stage: "configuration",
        email,
      });
      return sendJson(res, 500, {
        error: "Failed to send verification code",
      });
    }

    if (!emailUser || !emailPass) {
      await captureServerError(new Error("Missing email configuration"), {
        route: "/api/auth/send-signup-otp",
        stage: "configuration",
        email,
      });
      return sendJson(res, 500, {
        error: "Failed to send verification code",
      });
    }

    const [{ createClient }, nodemailerModule] = await Promise.all([
      import("@supabase/supabase-js"),
      import("nodemailer"),
    ]);

    const nodemailer = nodemailerModule.default || nodemailerModule;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    // Check if user or profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    const { data: authUserData } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = authUserData?.users?.find(
      (u: any) => u.email?.toLowerCase() === email,
    );

    if (existingProfile || existingAuthUser) {
      return sendJson(res, 200, {
        success: true,
        exists: true,
        message: "An account with this email already exists. Please log in.",
      });
    }

    const deleteResult = await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email);

    if (deleteResult.error) {
      await captureServerError(deleteResult.error, {
        route: "/api/auth/send-signup-otp",
        stage: "delete_existing_code",
        email,
      });
      return sendJson(res, 500, {
        error: "Failed to send verification code",
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const insertResult = await supabaseAdmin
      .from("verification_codes")
      .insert([{ email, code, expires_at: expiresAt }]);

    if (insertResult.error) {
      await captureServerError(insertResult.error, {
        route: "/api/auth/send-signup-otp",
        stage: "insert_code",
        email,
      });
      return sendJson(res, 500, {
        error: "Failed to send verification code",
      });
    }

    try {
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
        subject: "Your DevSchedule verification code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
            <h1 style="font-size: 24px; margin: 0 0 16px;">Verify your email</h1>
            <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #475569;">
              Use this one-time code to continue with DevSchedule.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px; text-align: center; margin-bottom: 24px;">
              <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #020617; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #64748b; margin: 0;">
              This code expires in 10 minutes. If you did not request it, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (error) {
      await captureServerError(error, {
        route: "/api/auth/send-signup-otp",
        stage: "send_email",
        email,
      });
      return sendJson(res, 500, {
        error: "Failed to send verification code",
      });
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    await captureServerError(error, {
      route: "/api/auth/send-signup-otp",
      stage: "unhandled",
    });
    return sendJson(res, 500, {
      error: "Failed to send verification code",
    });
  }
}
