import { captureServerError } from "../../server/sentry.js";

const normalizeUsernameBase = (value?: string | null) => {
  const normalized = (value || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized || "user";
};

const buildBaseUsername = (user: any) =>
  normalizeUsernameBase(
    user.user_metadata?.preferred_username ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      user.id,
  );

const getUniqueUsername = async (
  supabaseAdmin: any,
  baseUsername: string,
  userId: string,
) => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix =
      attempt === 0 ? "" : Math.floor(1000 + Math.random() * 9000).toString();
    const username = `${baseUsername}${suffix}`;
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username)
      .limit(1);

    if (error) throw error;
    if (!data?.[0] || data[0].id === userId) return username;
  }

  return `${baseUsername}${Date.now()}`;
};

const setErrorStage = (error: unknown, stage: string) => {
  if (error && typeof error === "object") {
    (error as { devscheduleStage?: string }).devscheduleStage = stage;
  }
  return error;
};

const getErrorStage = (error: unknown) =>
  error && typeof error === "object" && "devscheduleStage" in error
    ? String((error as { devscheduleStage?: string }).devscheduleStage)
    : "unhandled";

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

const isAuthUserMissing = async (supabaseAdmin: any, userId: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
  return Boolean(error || !data?.user);
};

const cleanupDeletedAuthProfilesByEmail = async ({
  supabaseAdmin,
  email,
  currentUserId,
}: {
  supabaseAdmin: any;
  email: string;
  currentUserId: string;
}) => {
  const { data: matchingProfiles, error: matchingProfilesError } =
    await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .ilike("email", email);

  if (matchingProfilesError) throw matchingProfilesError;

  for (const profile of matchingProfiles || []) {
    if (!profile?.id || profile.id === currentUserId) continue;
    if (!(await isAuthUserMissing(supabaseAdmin, profile.id))) continue;

    await deleteAppDataForUser({
      supabaseAdmin,
      userId: profile.id,
      email,
    });
  }
};

const ensureProfileForUser = async ({
  supabaseAdmin,
  user,
  googleAccessToken,
  googleRefreshToken,
}: {
  supabaseAdmin: any;
  user: any;
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
}) => {
  const { data: existingProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw setErrorStage(profileError, "profile_lookup");

  const fullName =
    user.user_metadata?.full_name || user.user_metadata?.name || "";
  const email = user.email || user.user_metadata?.email || "";

  if (!existingProfile && email) {
    await cleanupDeletedAuthProfilesByEmail({
      supabaseAdmin,
      email,
      currentUserId: user.id,
    });
  }

  if (existingProfile) {
    const updates: Record<string, string> = {};
    if (!existingProfile.email && email) updates.email = email;
    if (!existingProfile.full_name && fullName) updates.full_name = fullName;
    if (googleAccessToken) updates.google_access_token = googleAccessToken;
    if (googleRefreshToken) updates.google_refresh_token = googleRefreshToken;

    if (Object.keys(updates).length === 0) {
      return existingProfile;
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw setErrorStage(error, "profile_update");
    return data;
  }

  const username = await getUniqueUsername(
    supabaseAdmin,
    buildBaseUsername(user),
    user.id,
  );

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .insert([
      {
        id: user.id,
        full_name: fullName,
        email,
        username,
        google_access_token: googleAccessToken || null,
        google_refresh_token: googleRefreshToken || null,
      },
    ])
    .select()
    .single();

  if (error && email) {
    await cleanupDeletedAuthProfilesByEmail({
      supabaseAdmin,
      email,
      currentUserId: user.id,
    });

    const retryResult = await supabaseAdmin
      .from("profiles")
      .insert([
        {
          id: user.id,
          full_name: fullName,
          email,
          username: await getUniqueUsername(
            supabaseAdmin,
            buildBaseUsername(user),
            user.id,
          ),
          google_access_token: googleAccessToken || null,
          google_refresh_token: googleRefreshToken || null,
        },
      ])
      .select()
      .single();

    if (retryResult.error) {
      throw setErrorStage(retryResult.error, "profile_insert_retry");
    }
    return retryResult.data;
  }

  if (error) throw setErrorStage(error, "profile_insert");
  return data;
};

const ensureDefaultUserData = async (supabaseAdmin: any, userId: string) => {
  const { count, error: countError } = await supabaseAdmin
    .from("event_types")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  if (countError) throw setErrorStage(countError, "default_event_count");
  if (count && count > 0) return;

  const { data: existingSchedules, error: schedulesError } = await supabaseAdmin
    .from("schedules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (schedulesError) throw setErrorStage(schedulesError, "default_schedule_lookup");

  let scheduleId = existingSchedules?.[0]?.id;

  if (!scheduleId) {
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from("schedules")
      .insert([
        {
          name: "Working hours (default)",
          user_id: userId,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (scheduleError) throw setErrorStage(scheduleError, "default_schedule_insert");
    scheduleId = schedule.id;

    const defaultWeeklyHours = [
      { day_index: 0, enabled: false, slots: [] },
      {
        day_index: 1,
        enabled: true,
        slots: [{ id: "1", start: "09:00am", end: "05:00pm" }],
      },
      {
        day_index: 2,
        enabled: true,
        slots: [{ id: "2", start: "09:00am", end: "05:00pm" }],
      },
      {
        day_index: 3,
        enabled: true,
        slots: [{ id: "3", start: "09:00am", end: "05:00pm" }],
      },
      {
        day_index: 4,
        enabled: true,
        slots: [{ id: "4", start: "09:00am", end: "05:00pm" }],
      },
      {
        day_index: 5,
        enabled: true,
        slots: [{ id: "5", start: "09:00am", end: "05:00pm" }],
      },
      { day_index: 6, enabled: false, slots: [] },
    ];

    const { error: weeklyError } = await supabaseAdmin
      .from("weekly_hours")
      .insert(
        defaultWeeklyHours.map((day) => ({
          schedule_id: scheduleId,
          ...day,
        })),
      );

    if (weeklyError) throw setErrorStage(weeklyError, "default_weekly_hours_insert");
  }

  const { error: eventError } = await supabaseAdmin.from("event_types").insert([
    {
      title: "30 Minute Meeting",
      description:
        "A quick call to discuss your project requirements and how we can help.",
      duration: 30,
      slug: "30-minute-meeting",
      location_type: "web_conference",
      location: "Google Meet",
      type: "One-on-One",
      color: "bg-indigo-600",
      time_increment: 30,
      timezone_display: "detect",
      user_id: userId,
      schedule_id: scheduleId,
      link: `/placeholder/30-minute-meeting`,
    },
  ]);

  if (eventError) throw setErrorStage(eventError, "default_event_insert");
};

const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const getErrorDetails = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return { message: getErrorMessage(error) };
  }

  const typedError = error as {
    code?: string;
    details?: string;
    hint?: string;
    message?: string;
    name?: string;
    status?: number;
  };

  return {
    code: typedError.code,
    details: typedError.details,
    hint: typedError.hint,
    message: typedError.message || getErrorMessage(error),
    name: typedError.name,
    status: typedError.status,
  };
};

const createRequestId = () =>
  `ensure_profile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export default async function handler(req: any, res: any) {
  const requestId = createRequestId();

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

    const body = getBody(req.body) as {
      google_access_token?: string | null;
      google_refresh_token?: string | null;
    };

    const profile = await ensureProfileForUser({
      supabaseAdmin,
      user: data.user,
      googleAccessToken: body.google_access_token,
      googleRefreshToken: body.google_refresh_token,
    });

    await ensureDefaultUserData(supabaseAdmin, data.user.id);

    return sendJson(res, 200, { success: true, profile });
  } catch (error) {
    const stage = getErrorStage(error);
    const errorDetails = getErrorDetails(error);

    console.error("[ensure-profile] Failed", {
      requestId,
      stage,
      error: errorDetails,
    });

    await captureServerError(error, {
      route: "/api/auth/ensure-profile",
      requestId,
      stage,
      message: getErrorMessage(error),
      error: errorDetails,
    });

    return sendJson(res, 500, {
      error: "Failed to ensure profile",
      requestId,
      stage,
    });
  }
}
