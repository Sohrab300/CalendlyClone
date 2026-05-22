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

    const body = getBody(req.body) as { email?: string; code?: string };
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();

    if (!email || !code) {
      return sendJson(res, 400, {
        error: "Email and code are required",
        diagnosticCode: "verification_input_missing",
        requestId,
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseKey) {
      return sendJson(res, 500, {
        error: "Supabase server environment variables are missing",
        diagnosticCode: "supabase_env_missing",
        requestId,
      });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.warn("[verify-signup-otp] OTP not found", {
        requestId,
        email: maskEmail(email),
        error,
      });

      return sendJson(res, 400, {
        error: "Invalid verification code",
        diagnosticCode: "otp_not_found",
        requestId,
      });
    }

    if (new Date() > new Date(data.expires_at)) {
      return sendJson(res, 400, {
        error: "Verification code has expired",
        diagnosticCode: "otp_expired",
        requestId,
      });
    }

    const deleteResult = await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email);

    if (deleteResult.error) {
      console.error("[verify-signup-otp] DB delete failed", {
        requestId,
        email: maskEmail(email),
        error: deleteResult.error,
      });

      return sendJson(res, 500, {
        error: "Failed to complete verification",
        diagnosticCode: "db_verified_delete_failed",
        requestId,
      });
    }

    return sendJson(res, 200, { success: true, requestId });
  } catch (error) {
    console.error("[verify-signup-otp] Unexpected failure", {
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
