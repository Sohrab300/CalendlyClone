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
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = getBody(req.body) as {
      email?: string;
      userId?: string;
      verificationToken?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const userId = body.userId?.trim();
    const verificationToken = body.verificationToken?.trim();

    if (!email || !userId || !verificationToken) {
      return sendJson(res, 400, {
        error: "Email, user, and verification token are required",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseServiceKey) {
      await captureServerError(new Error("Missing Supabase configuration"), {
        route: "/api/auth/confirm-signup-email",
        stage: "configuration",
        email,
        userId,
      });
      return sendJson(res, 500, { error: "Signup confirmation failed" });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: verification, error: verificationError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", `signup_verified:${verificationToken}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (verificationError || !verification) {
      return sendJson(res, 400, { error: "Invalid signup verification" });
    }

    if (new Date() > new Date(verification.expires_at)) {
      await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("email", email)
        .eq("code", `signup_verified:${verificationToken}`);

      return sendJson(res, 400, { error: "Signup verification expired" });
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      return sendJson(res, 404, { error: "Signup user not found" });
    }

    if (userData.user.email?.toLowerCase() !== email) {
      return sendJson(res, 403, { error: "Signup verification mismatch" });
    }

    const { error: confirmError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });

    if (confirmError) {
      await captureServerError(confirmError, {
        route: "/api/auth/confirm-signup-email",
        stage: "confirm_email",
        email,
        userId,
      });
      return sendJson(res, 500, { error: "Signup confirmation failed" });
    }

    await supabaseAdmin
      .from("verification_codes")
      .delete()
      .eq("email", email)
      .eq("code", `signup_verified:${verificationToken}`);

    return sendJson(res, 200, { success: true });
  } catch (error) {
    await captureServerError(error, {
      route: "/api/auth/confirm-signup-email",
      stage: "unhandled",
    });
    return sendJson(res, 500, { error: "Signup confirmation failed" });
  }
}
