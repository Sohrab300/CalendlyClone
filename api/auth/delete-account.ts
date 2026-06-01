import { captureServerError } from "../../server/sentry";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl || !supabaseServiceKey) {
      return sendJson(res, 500, { error: "Server auth configuration missing" });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return sendJson(res, 401, { error: "Missing access token" });
    }

    const { createClient } = await import("@supabase/supabase-js");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return sendJson(res, 401, { error: "Invalid access token" });
    }

    const userId = data.user.id;

    // Delete the user from Supabase Auth
    // This will trigger cascade deletes if set up in the DB
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      throw deleteError;
    }

    return sendJson(res, 200, { success: true });
  } catch (error) {
    console.error("[delete-account] Failed", {
      error: getErrorMessage(error),
    });
    await captureServerError(error, {
      route: "/api/auth/delete-account",
      stage: "unhandled",
    });

    return sendJson(res, 500, { error: "Failed to delete account" });
  }
}
