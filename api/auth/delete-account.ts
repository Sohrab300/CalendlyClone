import { captureServerError } from "../../server/sentry.js";

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

const deleteAppDataForUser = async ({
  supabaseAdmin,
  userId,
  email,
}: {
  supabaseAdmin: any;
  userId: string;
  email?: string | null;
}) => {
  const { data: schedules, error: schedulesLookupError } = await supabaseAdmin
    .from("schedules")
    .select("id")
    .eq("user_id", userId);

  if (schedulesLookupError) throw schedulesLookupError;

  const scheduleIds = (schedules || []).map((schedule: { id: string }) => schedule.id);

  if (scheduleIds.length > 0) {
    const { error: weeklyHoursError } = await supabaseAdmin
      .from("weekly_hours")
      .delete()
      .in("schedule_id", scheduleIds);
    if (weeklyHoursError) throw weeklyHoursError;

    const { error: dateOverridesError } = await supabaseAdmin
      .from("date_overrides")
      .delete()
      .in("schedule_id", scheduleIds);
    if (dateOverridesError) throw dateOverridesError;
  }

  const deleteSteps = [
    supabaseAdmin.from("bookings").delete().eq("host_id", userId),
    supabaseAdmin.from("event_types").delete().eq("user_id", userId),
    supabaseAdmin.from("schedules").delete().eq("user_id", userId),
    supabaseAdmin.from("profiles").delete().eq("id", userId),
  ];

  if (email) {
    deleteSteps.push(
      supabaseAdmin.from("verification_codes").delete().eq("email", email),
    );
  }

  for (const step of deleteSteps) {
    const { error } = await step;
    if (error) throw error;
  }
};

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
    const email = data.user.email || data.user.user_metadata?.email || null;

    await deleteAppDataForUser({
      supabaseAdmin,
      userId,
      email,
    });

    // Delete the user from Supabase Auth
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
      message: getErrorMessage(error),
    });

    return sendJson(res, 500, { error: "Failed to delete account" });
  }
}
