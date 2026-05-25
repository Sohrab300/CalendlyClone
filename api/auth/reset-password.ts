import { createClient } from "@supabase/supabase-js";
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
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = getBody(req.body) as {
      email?: string;
      token?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const token = body.token?.trim();
    const password = body.password || "";

    if (!email || !token || !password) {
      return sendJson(res, 400, { error: "Missing reset information" });
    }

    if (!token.startsWith("pwd_")) {
      return sendJson(res, 400, { error: "Invalid or expired reset link" });
    }

    if (password.length < 8) {
      return sendJson(res, 400, {
        error: "Password must be at least 8 characters",
      });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseServiceKey) {
      await captureServerError(new Error("Password reset configuration missing"), {
        route: "/api/auth/reset-password",
        stage: "configuration",
        email,
      });
      return sendJson(res, 500, { error: "Password reset is not configured" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: resetCode, error: resetError } = await supabaseAdmin
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .eq("code", token)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (resetError || !resetCode || new Date() > new Date(resetCode.expires_at)) {
      return sendJson(res, 400, { error: "Invalid or expired reset link" });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (profileError || !profile?.id) {
      if (profileError) {
        await captureServerError(profileError, {
          route: "/api/auth/reset-password",
          stage: "profile_lookup",
          email,
        });
      }
      return sendJson(res, 404, { error: "User doesn't exist" });
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password },
    );

    if (updateError) {
      await captureServerError(updateError, {
        route: "/api/auth/reset-password",
        stage: "update_password",
        email,
        userId: profile.id,
      });
      return sendJson(res, 500, { error: "Failed to update password" });
    }

    await supabaseAdmin.from("verification_codes").delete().eq("email", email);

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("[reset-password] Failed", error);
    await captureServerError(error, {
      route: "/api/auth/reset-password",
      stage: "unhandled",
    });
    return sendJson(res, 500, { error: "Failed to update password" });
  }
}
