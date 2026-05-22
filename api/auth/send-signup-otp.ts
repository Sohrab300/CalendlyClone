const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

const getRequestId = (req: any) => {
  const vercelId = req.headers?.["x-vercel-id"];
  const requestId = req.headers?.["x-request-id"];

  if (typeof vercelId === "string") return vercelId;
  if (Array.isArray(vercelId) && vercelId[0]) return vercelId[0];
  if (typeof requestId === "string") return requestId;
  if (Array.isArray(requestId) && requestId[0]) return requestId[0];

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const maskEmail = (email?: string) => {
  if (!email) return "";

  const [localPart, domain = ""] = email.split("@");
  const maskedLocal =
    localPart.length <= 2
      ? `${localPart[0] || "*"}***`
      : `${localPart.slice(0, 2)}***${localPart.slice(-1)}`;

  return domain ? `${maskedLocal}@${domain}` : maskedLocal;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

export default async function handler(req: any, res: any) {
  const requestId = getRequestId(req);

  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, {
        error: "Method not allowed",
        diagnosticCode: "method_not_allowed",
        requestId,
      });
    }

    const body = getBody(req.body) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return sendJson(res, 400, {
        error: "Email is required",
        diagnosticCode: "email_missing",
        requestId,
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const emailUser = process.env.EMAIL_USER?.trim();
    const emailPass = process.env.EMAIL_PASS?.trim();

    if (!supabaseUrl || !supabaseKey) {
      return sendJson(res, 500, {
        error: "Supabase server environment variables are missing",
        diagnosticCode: "supabase_env_missing",
        requestId,
      });
    }

    if (!emailUser || !emailPass) {
      return sendJson(res, 500, {
        error: "Email server environment variables are missing",
        diagnosticCode: "email_env_missing",
        requestId,
      });
    }

    const [{ createClient }, nodemailerModule] = await Promise.all([
      import("@supabase/supabase-js"),
      import("nodemailer"),
    ]);

    const nodemailer = nodemailerModule.default || nodemailerModule;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const deleteResult = await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email);

    if (deleteResult.error) {
      console.error("[send-signup-otp] DB delete failed", {
        requestId,
        email: maskEmail(email),
        error: deleteResult.error,
      });

      return sendJson(res, 500, {
        error: "Failed to reset verification code",
        diagnosticCode: "db_delete_failed",
        requestId,
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const insertResult = await supabaseAdmin
      .from("verification_codes")
      .insert([{ email, code, expires_at: expiresAt }]);

    if (insertResult.error) {
      console.error("[send-signup-otp] DB insert failed", {
        requestId,
        email: maskEmail(email),
        error: insertResult.error,
      });

      return sendJson(res, 500, {
        error: "Failed to store verification code",
        diagnosticCode: "db_insert_failed",
        requestId,
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
      console.error("[send-signup-otp] Email send failed", {
        requestId,
        email: maskEmail(email),
        error: getErrorMessage(error),
      });

      return sendJson(res, 500, {
        error: "Failed to send verification email",
        diagnosticCode: "email_send_failed",
        requestId,
      });
    }

    return sendJson(res, 200, { success: true, requestId });
  } catch (error) {
    console.error("[send-signup-otp] Unexpected failure", {
      requestId,
      error: getErrorMessage(error),
    });

    return sendJson(res, 500, {
      error: "Unexpected server error",
      diagnosticCode: "unexpected_server_error",
      requestId,
      details: getErrorMessage(error),
    });
  }
}
