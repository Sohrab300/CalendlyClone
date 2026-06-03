import express from "express";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import { OtpServiceError, sendOtp, verifyOtp } from "./server/otpService";

dotenv.config();

type HostProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  username?: string | null;
  host_notifications_enabled?: boolean | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
};

const normalizeUsernameBase = (value?: string | null) => {
  const normalized = (value || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
  return normalized || "user";
};

const buildBaseUsername = (user: any) =>
  normalizeUsernameBase(
    user.user_metadata?.username ||
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

const encodeBase64Url = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const logoContentId = "devschedule-logo";
const logoPath = new URL("./public/favicon-f.png", import.meta.url);

const chunkBase64 = (value: string) =>
  value.match(/.{1,76}/g)?.join("\r\n") || value;

const getLogoBase64 = () => {
  if (!existsSync(logoPath)) return null;
  return readFileSync(logoPath).toString("base64");
};

const emailLogoHtml = `
  <div style="text-align: center; padding: 24px 24px 8px;">
    <img src="cid:${logoContentId}" alt="DevSchedule" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain;" />
  </div>
`;

const createHostOAuthClient = (hostProfile: HostProfile, supabaseAdmin: any) => {
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET
  ) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  oauth2Client.setCredentials({
    access_token: hostProfile.google_access_token || undefined,
    refresh_token: hostProfile.google_refresh_token || undefined,
  });

  oauth2Client.on("tokens", async (tokens) => {
    const updates: Record<string, string> = {};

    if (tokens.refresh_token) {
      updates.google_refresh_token = tokens.refresh_token;
    }

    if (tokens.access_token) {
      updates.google_access_token = tokens.access_token;
    }

    if (Object.keys(updates).length === 0) return;

    const { error } = await supabaseAdmin
      .from("profiles")
      .update(updates)
      .eq("id", hostProfile.id);

    if (error) {
      console.error("[Google OAuth] Failed to persist refreshed tokens:", error);
    }
  });

  return oauth2Client;
};

const getGoogleApiErrorInfo = (error: any) => {
  const responseData = error?.response?.data || {};
  const code =
    responseData.error ||
    error?.cause?.message ||
    error?.code ||
    "google_api_error";
  const description =
    responseData.error_description ||
    error?.message ||
    "Google API request failed";

  return {
    code: String(code),
    message: String(description),
    status: error?.status || error?.response?.status || null,
  };
};

const isGoogleAuthRecoveryRequired = (error: any) => {
  const { code } = getGoogleApiErrorInfo(error);
  return [
    "deleted_client",
    "invalid_client",
    "invalid_grant",
    "unauthorized_client",
  ].includes(code);
};

const clearHostGoogleTokens = async (
  supabaseAdmin: any,
  hostProfile: HostProfile,
) => {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      google_access_token: null,
      google_refresh_token: null,
    })
    .eq("id", hostProfile.id);

  if (error) {
    console.error("[Google OAuth] Failed to clear stale host tokens:", error);
  }
};

const buildBookingConfirmationHtml = ({
  eventTitle,
  hostDisplayName,
  inviteeName,
  startTime,
  endTime,
  timezone,
  googleMeetLink,
}: {
  eventTitle: string;
  hostDisplayName: string;
  inviteeName: string;
  startTime: string;
  endTime: string;
  timezone: string;
  googleMeetLink?: string | null;
}) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
    ${emailLogoHtml}
    <div style="background-color: #006bff; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Booking confirmed</h1>
    </div>
    <div style="padding: 32px; color: #0f172a;">
      <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hi ${inviteeName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">
        Your meeting with <strong>${hostDisplayName}</strong> has been scheduled.
      </p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 10px 0;"><strong>Event:</strong> ${eventTitle}</p>
        <p style="margin: 10px 0;"><strong>Host:</strong> ${hostDisplayName}</p>
        <p style="margin: 10px 0;"><strong>Invitee:</strong> ${inviteeName}</p>
        <p style="margin: 10px 0;"><strong>Date and start:</strong> ${startTime}</p>
        <p style="margin: 10px 0;"><strong>End:</strong> ${endTime}</p>
        <p style="margin: 10px 0;"><strong>Timezone:</strong> ${timezone}</p>
        ${
          googleMeetLink
            ? `<p style="margin: 10px 0;"><strong>Google Meet:</strong> <a href="${googleMeetLink}" style="color: #006bff;">${googleMeetLink}</a></p>`
            : ""
        }
      </div>
    </div>
  </div>
`;

const buildHostNotificationHtml = ({
  eventTitle,
  hostDisplayName,
  inviteeName,
  inviteeEmail,
  startTime,
  endTime,
  timezone,
  googleMeetLink,
  whatsappInfo,
  automationInterests,
}: {
  eventTitle: string;
  hostDisplayName: string;
  inviteeName: string;
  inviteeEmail: string;
  startTime: string;
  endTime: string;
  timezone: string;
  googleMeetLink?: string | null;
  whatsappInfo: string;
  automationInterests: string;
}) => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
    ${emailLogoHtml}
    <div style="background-color: #006bff; padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New booking</h1>
    </div>
    <div style="padding: 32px; color: #0f172a;">
      <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">Hello ${hostDisplayName},</p>
      <p style="font-size: 16px; line-height: 1.6; color: #475569;">
        A new meeting has been scheduled from your booking page.
      </p>
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #e2e8f0;">
        <p style="margin: 10px 0;"><strong>Event:</strong> ${eventTitle}</p>
        <p style="margin: 10px 0;"><strong>Invitee:</strong> ${inviteeName}</p>
        <p style="margin: 10px 0;"><strong>Email:</strong> ${inviteeEmail}</p>
        <p style="margin: 10px 0;"><strong>Start:</strong> ${startTime}</p>
        <p style="margin: 10px 0;"><strong>End:</strong> ${endTime}</p>
        <p style="margin: 10px 0;"><strong>Timezone:</strong> ${timezone}</p>
        <p style="margin: 10px 0;"><strong>WhatsApp:</strong> ${whatsappInfo}</p>
        <p style="margin: 10px 0;"><strong>Interests:</strong> ${automationInterests}</p>
        ${
          googleMeetLink
            ? `<p style="margin: 10px 0;"><strong>Google Meet:</strong> <a href="${googleMeetLink}" style="color: #006bff;">${googleMeetLink}</a></p>`
            : ""
        }
      </div>
    </div>
  </div>
`;

const buildRawEmail = ({
  from,
  to,
  subject,
  html,
}: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) => {
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const logoBase64 = getLogoBase64();

  if (logoBase64) {
    const boundary = `devschedule_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${encodedSubject}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/related; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      chunkBase64(Buffer.from(html, "utf8").toString("base64")),
      `--${boundary}`,
      'Content-Type: image/png; name="favicon-f.png"',
      "Content-Transfer-Encoding: base64",
      `Content-ID: <${logoContentId}>`,
      'Content-Disposition: inline; filename="favicon-f.png"',
      "",
      chunkBase64(logoBase64),
      `--${boundary}--`,
      "",
    ].join("\r\n");

    return encodeBase64Url(message);
  }

  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    chunkBase64(Buffer.from(html, "utf8").toString("base64")),
  ].join("\r\n");

  return encodeBase64Url(message);
};

const sendHostGmailEmail = async ({
  oauth2Client,
  hostEmail,
  hostDisplayName,
  toEmail,
  eventTitle,
  subject,
  html,
}: {
  oauth2Client: any;
  hostEmail: string;
  hostDisplayName: string;
  toEmail: string;
  eventTitle: string;
  subject: string;
  html: string;
}) => {
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: buildRawEmail({
        from: `"DevSchedule" <${hostEmail}>`,
        to: toEmail,
        subject,
        html,
      }),
    },
  });
};

const sendInviteeBookingEmail = async ({
  oauth2Client,
  hostEmail,
  hostDisplayName,
  inviteeEmail,
  eventTitle,
  inviteeName,
  startTime,
  endTime,
  timezone,
  googleMeetLink,
}: {
  oauth2Client: any;
  hostEmail: string;
  hostDisplayName: string;
  inviteeEmail: string;
  eventTitle: string;
  inviteeName: string;
  startTime: string;
  endTime: string;
  timezone: string;
  googleMeetLink?: string | null;
}) => {
  const html = buildBookingConfirmationHtml({
    eventTitle,
    hostDisplayName,
    inviteeName,
    startTime,
    endTime,
    timezone,
    googleMeetLink,
  });

  await sendHostGmailEmail({
    oauth2Client,
    hostEmail,
    hostDisplayName,
    toEmail: inviteeEmail,
    eventTitle,
    subject: `Invitation: ${eventTitle} with ${hostDisplayName}`,
    html,
  });
};

const createHostCalendarEvent = async ({
  oauth2Client,
  hostDisplayName,
  inviteeName,
  inviteeEmail,
  eventTitle,
  rawStartTime,
  rawEndTime,
  timezone,
  whatsappInfo,
  automationInterests,
}: {
  oauth2Client: any;
  hostDisplayName: string;
  inviteeName: string;
  inviteeEmail: string;
  eventTitle: string;
  rawStartTime: string;
  rawEndTime: string;
  timezone: string;
  whatsappInfo: string;
  automationInterests: string;
}) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: `${eventTitle}: ${inviteeName} & ${hostDisplayName}`,
    description: `Meeting scheduled via DevSchedule.\n\nInvitee: ${inviteeName} (${inviteeEmail})\nAutomation Interests: ${automationInterests}\nWhatsapp: ${whatsappInfo}`,
    start: {
      dateTime: new Date(rawStartTime).toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: new Date(rawEndTime).toISOString(),
      timeZone: timezone,
    },
    attendees: [{ email: inviteeEmail, displayName: inviteeName }],
    conferenceData: {
      createRequest: {
        requestId: `devschedule-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: "all",
  });

  return response.data;
};

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Supabase Admin client for verification codes
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  app.post("/api/auth/ensure-profile", async (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return res.status(401).json({ error: "Missing access token" });
    }

    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({ error: "Invalid access token" });
      }

      const profile = await ensureProfileForUser({
        supabaseAdmin,
        user: data.user,
        googleAccessToken: req.body?.google_access_token,
        googleRefreshToken: req.body?.google_refresh_token,
      });

      await ensureDefaultUserData(supabaseAdmin, data.user.id);

      res.json({ success: true, profile });
    } catch (error) {
      console.error("[EnsureProfile] Failed to ensure profile:", error);
      res.status(500).json({ error: "Failed to ensure profile" });
    }
  });

  app.post("/api/auth/delete-account", async (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : "";

    if (!token) {
      return res.status(401).json({ error: "Missing access token" });
    }

    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        return res.status(401).json({ error: "Invalid access token" });
      }

      await deleteAppDataForUser({
        supabaseAdmin,
        userId: data.user.id,
        email: data.user.email || data.user.user_metadata?.email || null,
      });

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
        data.user.id,
      );

      if (deleteError) {
        throw deleteError;
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[DeleteAccount] Failed to delete account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  // API Route for sending verification OTP
  app.post("/api/verification/send", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
      await sendOtp(supabaseAdmin, email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending verification email:", error);
      if (error instanceof OtpServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to send verification email",
      });
    }
  });

  // API Route for verifying OTP
  app.post("/api/verification/verify", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code)
      return res.status(400).json({ error: "Email and code are required" });

    try {
      await verifyOtp(supabaseAdmin, email, code);
      res.json({ success: true });
    } catch (err) {
      console.error("Verification error:", err);
      if (err instanceof OtpServiceError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // SIGNUP OTP ROUTES
  app.post("/api/auth/send-signup-otp", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
      await sendOtp(supabaseAdmin, email);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending signup OTP:", error);
      if (error instanceof OtpServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to send verification code",
      });
    }
  });

  app.post("/api/auth/verify-signup-otp", async (req, res) => {
    const email = req.body?.email?.trim().toLowerCase();
    const { code } = req.body;
    if (!email || !code)
      return res.status(400).json({ error: "Email and code are required" });

    try {
      await verifyOtp(supabaseAdmin, email, code);
      const verificationToken = randomBytes(32).toString("hex");
      const verifiedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { error } = await supabaseAdmin.from("verification_codes").insert([
        {
          email,
          code: `signup_verified:${verificationToken}`,
          expires_at: verifiedUntil,
        },
      ]);

      if (error) {
        console.error("Error storing signup verification token:", error);
        return res.status(500).json({ error: "Verification failed" });
      }

      res.json({ success: true, verificationToken });
    } catch (err) {
      console.error("Verification error:", err);
      if (err instanceof OtpServiceError) {
        return res.status(err.statusCode).json({ error: err.message });
      }
      res.status(500).json({ error: "Verification failed" });
    }
  });

  app.post("/api/auth/confirm-signup-email", async (req, res) => {
    const email = req.body?.email?.trim().toLowerCase();
    const userId = req.body?.userId?.trim();
    const verificationToken = req.body?.verificationToken?.trim();

    if (!email || !userId || !verificationToken) {
      return res.status(400).json({
        error: "Email, user, and verification token are required",
      });
    }

    try {
      const { data: verification, error: verificationError } =
        await supabaseAdmin
          .from("verification_codes")
          .select("*")
          .eq("email", email)
          .eq("code", `signup_verified:${verificationToken}`)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

      if (verificationError || !verification) {
        return res.status(400).json({ error: "Invalid signup verification" });
      }

      if (new Date() > new Date(verification.expires_at)) {
        await supabaseAdmin
          .from("verification_codes")
          .delete()
          .eq("email", email)
          .eq("code", `signup_verified:${verificationToken}`);

        return res.status(400).json({ error: "Signup verification expired" });
      }

      const { data: userData, error: userError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (userError || !userData.user) {
        return res.status(404).json({ error: "Signup user not found" });
      }

      if (userData.user.email?.toLowerCase() !== email) {
        return res.status(403).json({ error: "Signup verification mismatch" });
      }

      const { error: confirmError } =
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          email_confirm: true,
        });

      if (confirmError) {
        console.error("Error confirming signup email:", confirmError);
        return res.status(500).json({ error: "Signup confirmation failed" });
      }

      await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("email", email)
        .eq("code", `signup_verified:${verificationToken}`);

      res.json({ success: true });
    } catch (error) {
      console.error("Error confirming signup email:", error);
      res.status(500).json({ error: "Signup confirmation failed" });
    }
  });

  app.post("/api/auth/request-password-reset", async (req, res) => {
    const email = req.body?.email?.trim().toLowerCase();
    if (!email) return res.status(400).json({ error: "Email is required" });

    if (!process.env.EMAIL_USER?.trim() || !process.env.EMAIL_PASS?.trim()) {
      return res.status(500).json({ error: "Password reset is not configured" });
    }

    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id, email, full_name")
        .ilike("email", email)
        .maybeSingle();

      if (profileError) {
        return res.status(500).json({ error: "Failed to verify user" });
      }

      if (!profile) {
        return res.status(404).json({ error: "User doesn't exist" });
      }

      const token = `pwd_${randomBytes(32).toString("hex")}`;
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error: deleteError } = await supabaseAdmin
        .from("verification_codes")
        .delete()
        .eq("email", email);

      if (deleteError) {
        return res.status(500).json({ error: "Failed to create reset link" });
      }

      const { error: insertError } = await supabaseAdmin
        .from("verification_codes")
        .insert([{ email, code: token, expires_at: expiresAt }]);

      if (insertError) {
        return res.status(500).json({ error: "Failed to create reset link" });
      }

      const resetUrl = `${req.protocol}://${req.get("host")}/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER.trim(),
          pass: process.env.EMAIL_PASS.trim(),
        },
      });

      await transporter.sendMail({
        from: `"DevSchedule" <${process.env.EMAIL_USER.trim()}>`,
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

      res.json({ success: true });
    } catch (error) {
      console.error("[PasswordReset] Failed to send reset link:", error);
      res.status(500).json({ error: "Failed to send password reset link" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    const email = req.body?.email?.trim().toLowerCase();
    const token = req.body?.token?.trim();
    const password = req.body?.password || "";

    if (!email || !token || !password) {
      return res.status(400).json({ error: "Missing reset information" });
    }

    if (!token.startsWith("pwd_")) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters" });
    }

    try {
      const { data: resetCode, error: resetError } = await supabaseAdmin
        .from("verification_codes")
        .select("*")
        .eq("email", email)
        .eq("code", token)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (
        resetError ||
        !resetCode ||
        new Date() > new Date(resetCode.expires_at)
      ) {
        return res.status(400).json({ error: "Invalid or expired reset link" });
      }

      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .ilike("email", email)
        .maybeSingle();

      if (profileError || !profile?.id) {
        return res.status(404).json({ error: "User doesn't exist" });
      }

      const { error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(profile.id, {
          password,
        });

      if (updateError) {
        return res.status(500).json({ error: "Failed to update password" });
      }

      await supabaseAdmin.from("verification_codes").delete().eq("email", email);

      res.json({ success: true });
    } catch (error) {
      console.error("[PasswordReset] Failed to update password:", error);
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  // API Route for scheduling and sending email
  app.post("/api/schedule", async (req, res) => {
    const {
      name,
      email,
      eventTitle,
      startTime,
      endTime,
      timezone,
      whatsapp,
      automationType,
      rawStartTime,
      rawEndTime,
      hostUsername,
    } = req.body;
    const inviteeName = name || req.body.firstName || "Invitee";

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const automationInterests = Array.isArray(automationType)
        ? automationType.join(", ")
        : "None specified";
      const whatsappInfo = whatsapp || "Not provided";

      let hostProfile: HostProfile | null = null;
      let hostEmail = "";
      let hostDisplayName = "Host";
      let hostNotificationsEnabled = true;

      try {
        if (hostUsername) {
          const { data: profile, error: profileError } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, username, host_notifications_enabled, email, full_name, google_access_token, google_refresh_token",
            )
            .eq("username", hostUsername)
            .single();

          if (profileError) {
            console.warn(
              `[Schedule API] Profile lookup error for ${hostUsername}:`,
              profileError.message,
            );
          }

          if (profile) {
            hostProfile = profile as HostProfile;
            if (profile.host_notifications_enabled === false) {
              hostNotificationsEnabled = false;
            }
            if (profile.email) {
              hostEmail = profile.email;
            }
            if (profile.full_name) {
              hostDisplayName = profile.full_name;
            }
          } else {
            console.warn(
              `[Schedule API] No profile found for username: ${hostUsername}`,
            );
          }
        }
      } catch (err) {
        console.warn("[Schedule API] Exception during profile fetching:", err);
      }

      if (!hostProfile?.google_refresh_token) {
        console.warn(
          "Host has no Google refresh token — skipping Gmail and Calendar for this booking",
        );
        return res.json({
          success: true,
          warning:
            "Host has no Google refresh token; Gmail and Calendar were skipped",
        });
      }

      if (!hostEmail) {
        console.warn(
          "[Schedule API] Host profile has Google tokens but no email; skipping Gmail and Calendar for this booking",
        );
        return res.json({
          success: true,
          warning: "Host email missing; Gmail and Calendar were skipped",
        });
      }

      const oauth2Client = createHostOAuthClient(hostProfile, supabaseAdmin);
      let googleMeetLink: string | null = null;
      let calendarStatus: "fulfilled" | "rejected" = "fulfilled";
      let inviteeEmailStatus: "fulfilled" | "rejected" = "fulfilled";
      let hostEmailStatus: "fulfilled" | "rejected" | "skipped" =
        hostNotificationsEnabled ? "fulfilled" : "skipped";
      const errors: string[] = [];
      let googleAuthRecoveryRequired = false;

      const handleGoogleOperationError = async (
        label: string,
        error: unknown,
      ) => {
        const googleError = getGoogleApiErrorInfo(error);
        errors.push(`${label}: ${googleError.code}`);
        console.error(`[Schedule API] ${label} failed:`, googleError);

        if (
          !googleAuthRecoveryRequired &&
          isGoogleAuthRecoveryRequired(error)
        ) {
          googleAuthRecoveryRequired = true;
          await clearHostGoogleTokens(supabaseAdmin, hostProfile);
          errors.push(
            "Host Google account needs to be reconnected before Gmail and Calendar can be used",
          );
          console.warn(
            "[Schedule API] Host Google OAuth tokens were cleared; host must reconnect Google",
          );
        }
      };

      try {
        const googleEvent = await createHostCalendarEvent({
          oauth2Client,
          hostDisplayName,
          inviteeName,
          inviteeEmail: email,
          eventTitle,
          rawStartTime,
          rawEndTime,
          timezone,
          whatsappInfo,
          automationInterests,
        });
        googleMeetLink = googleEvent.hangoutLink || null;
      } catch (calendarError) {
        calendarStatus = "rejected";
        inviteeEmailStatus = "rejected";
        await handleGoogleOperationError(
          "Calendar",
          calendarError,
        );
      }

      if (googleAuthRecoveryRequired) {
        inviteeEmailStatus = "rejected";
        if (hostNotificationsEnabled) {
          hostEmailStatus = "rejected";
        }
      }

      if (hostNotificationsEnabled && !googleAuthRecoveryRequired) {
        try {
          await sendHostGmailEmail({
            oauth2Client,
            hostEmail,
            hostDisplayName,
            toEmail: hostEmail,
            eventTitle,
            subject: `New Event: ${eventTitle} with ${inviteeName}`,
            html: buildHostNotificationHtml({
              eventTitle,
              hostDisplayName,
              inviteeName,
              inviteeEmail: email,
              startTime,
              endTime,
              timezone,
              googleMeetLink,
              whatsappInfo,
              automationInterests,
            }),
          });
        } catch (hostGmailError) {
          hostEmailStatus = "rejected";
          await handleGoogleOperationError(
            "Host email",
            hostGmailError,
          );
        }
      }

      res.json({
        success: true,
        calendarStatus,
        googleMeetLink,
        errors,
        emailStatus: [
          { type: "Invitee", status: inviteeEmailStatus },
          { type: "Host", status: hostEmailStatus },
        ],
      });
    } catch (error) {
      console.error("[Schedule API] Fatal error in schedule route:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Internal server error during scheduling.",
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
