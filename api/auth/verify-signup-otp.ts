import { captureServerError } from "../../server/sentry";

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

    const body = getBody(req.body) as { email?: string; code?: string };
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();

    if (!email || !code) {
      return sendJson(res, 400, {
        error: "Email and code are required",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseKey) {
      await captureServerError(new Error("Missing Supabase configuration"), {
        route: "/api/auth/verify-signup-otp",
        stage: "configuration",
        email,
      });
      return sendJson(res, 500, {
        error: "Verification failed",
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
      return sendJson(res, 400, {
        error: "Invalid verification code",
      });
    }

    if (new Date() > new Date(data.expires_at)) {
      return sendJson(res, 400, {
        error: "Verification code has expired",
      });
    }

    const deleteResult = await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email);

    if (deleteResult.error) {
      await captureServerError(deleteResult.error, {
        route: "/api/auth/verify-signup-otp",
        stage: "delete_code",
        email,
      });
      return sendJson(res, 500, {
        error: "Verification failed",
      });
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    await captureServerError(error, {
      route: "/api/auth/verify-signup-otp",
      stage: "unhandled",
    });
    return sendJson(res, 500, {
      error: "Verification failed",
    });
  }
}
