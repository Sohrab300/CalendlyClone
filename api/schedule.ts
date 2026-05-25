import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { captureServerError } from "../server/sentry";

type HostProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  username?: string | null;
  host_notifications_enabled?: boolean | null;
  google_access_token: string | null;
  google_refresh_token: string | null;
};

const getBody = (body: unknown) => {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body && typeof body === "object" ? body : {};
};

const sendJson = (res: any, status: number, body: Record<string, unknown>) =>
  res.status(status).json(body);

const GENERIC_SCHEDULING_ERROR =
  "We couldn't book this meeting right now. Please try again after some time.";

const createRequestId = () =>
  `sched_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const notifySchedulingFailure = async ({
  requestId,
  stage,
  status,
  error,
  context,
}: {
  requestId: string;
  stage: string;
  status: number;
  error: unknown;
  context: Record<string, unknown>;
}) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const payload = {
    requestId,
    stage,
    status,
    message,
    stack,
    context,
  };

  console.error("[api/schedule] Scheduling failure", payload);
  await captureServerError(error, {
    route: "/api/schedule",
    requestId,
    stage,
    status,
    context,
  });

  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim();

  if (!emailUser || !emailPass) {
    console.error("[api/schedule] Failure notification email not configured", {
      requestId,
    });
    return;
  }

  try {
    const nodemailerModule = await import("nodemailer");
    const nodemailer = nodemailerModule.default || nodemailerModule;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"DevSchedule Alerts" <${emailUser}>`,
      to: emailUser,
      subject: `DevSchedule booking failed: ${stage} (${requestId})`,
      text: JSON.stringify(payload, null, 2),
    });
  } catch (notificationError) {
    console.error("[api/schedule] Failed to send failure notification", {
      requestId,
      notificationError,
    });
  }
};

const encodeBase64Url = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const chunkBase64 = (value: string) =>
  value.match(/.{1,76}/g)?.join("\r\n") || value;

const logoContentId = "devschedule-logo";
const logoPath = path.join(process.cwd(), "public", "favicon-f.png");

const getLogoBase64 = () => {
  if (!existsSync(logoPath)) return null;
  return readFileSync(logoPath).toString("base64");
};

const emailLogoHtml = `
  <div style="text-align: center; padding: 24px 24px 8px;">
    <img src="cid:${logoContentId}" alt="DevSchedule" width="56" height="56" style="display: inline-block; width: 56px; height: 56px; object-fit: contain;" />
  </div>
`;

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

export default async function handler(req: any, res: any) {
  const requestId = createRequestId();

  try {
    if (req.method !== "POST") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }

    const body = getBody(req.body) as any;
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
    } = body;
    const inviteeName = name || body.firstName || "Invitee";
    const failureContext = {
      requestId,
      hostUsername,
      eventTitle,
      inviteeEmail: email,
      inviteeName,
      startTime,
      endTime,
      timezone,
      rawStartTime,
      rawEndTime,
    };
    const failScheduling = async (
      stage: string,
      status: number,
      error: unknown,
      details: Record<string, unknown> = {},
    ) => {
      await notifySchedulingFailure({
        requestId,
        stage,
        status,
        error,
        context: {
          ...failureContext,
          ...details,
        },
      });

      return sendJson(res, status, {
        error: GENERIC_SCHEDULING_ERROR,
        requestId,
      });
    };

    if (!email) {
      return sendJson(res, 400, { error: "Email is required" });
    }

    if (!hostUsername) {
      return sendJson(res, 400, { error: "Host username is required" });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
    const missingGoogleConfig = [
      !googleClientId ? "GOOGLE_CLIENT_ID" : null,
      !googleClientSecret ? "GOOGLE_CLIENT_SECRET" : null,
    ].filter(Boolean);

    if (!supabaseUrl || !supabaseServiceKey) {
      return failScheduling(
        "configuration",
        500,
        new Error("Server database configuration missing"),
      );
    }

    if (missingGoogleConfig.length > 0) {
      return failScheduling(
        "configuration",
        500,
        new Error(
          `Google integration configuration missing: ${missingGoogleConfig.join(", ")}`,
        ),
      );
    }

    const [{ createClient }, { google }] = await Promise.all([
      import("@supabase/supabase-js"),
      import("googleapis"),
    ]);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, username, host_notifications_enabled, email, full_name, google_access_token, google_refresh_token",
      )
      .eq("username", hostUsername)
      .single();

    if (profileError || !profile) {
      return failScheduling(
        "host_profile_lookup",
        404,
        profileError || new Error("Host profile not found"),
      );
    }

    const hostProfile = profile as HostProfile;
    const hostEmail = hostProfile.email || "";
    const hostDisplayName = hostProfile.full_name || "Host";
    const hostNotificationsEnabled =
      hostProfile.host_notifications_enabled !== false;

    if (!hostProfile.google_refresh_token) {
      return failScheduling(
        "host_google_connection",
        409,
        new Error("Host Google account is not connected"),
        { hostId: hostProfile.id },
      );
    }

    if (!hostEmail) {
      return failScheduling("host_email", 409, new Error("Host email is missing"), {
        hostId: hostProfile.id,
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      googleClientId,
      googleClientSecret,
      googleRedirectUri || undefined,
    );

    oauth2Client.setCredentials({
      access_token: hostProfile.google_access_token || undefined,
      refresh_token: hostProfile.google_refresh_token || undefined,
    });

    oauth2Client.on("tokens", async (tokens) => {
      const updates: Record<string, string> = {};
      if (tokens.refresh_token) updates.google_refresh_token = tokens.refresh_token;
      if (tokens.access_token) updates.google_access_token = tokens.access_token;
      if (Object.keys(updates).length === 0) return;

      await supabaseAdmin.from("profiles").update(updates).eq("id", hostProfile.id);
    });

    const errors: string[] = [];
    const handleGoogleOperationError = async (label: string, error: unknown) => {
      const googleError = getGoogleApiErrorInfo(error);
      errors.push(`${label}: ${googleError.code}`);

      if (isGoogleAuthRecoveryRequired(error)) {
        await supabaseAdmin
          .from("profiles")
          .update({
            google_access_token: null,
            google_refresh_token: null,
          })
          .eq("id", hostProfile.id);
        errors.push("Host Google account needs to be reconnected");
      }

      return googleError;
    };

    const automationInterests = Array.isArray(automationType)
      ? automationType.join(", ")
      : "None specified";
    const whatsappInfo = whatsapp || "Not provided";

    let googleMeetLink: string | null = null;

    try {
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      const googleEvent = await calendar.events.insert({
        calendarId: "primary",
        conferenceDataVersion: 1,
        sendUpdates: "all",
        requestBody: {
          summary: `${eventTitle}: ${inviteeName} & ${hostDisplayName}`,
          description: `Meeting scheduled via DevSchedule.\n\nInvitee: ${inviteeName} (${email})\nAutomation Interests: ${automationInterests}\nWhatsapp: ${whatsappInfo}`,
          start: {
            dateTime: new Date(rawStartTime).toISOString(),
            timeZone: timezone,
          },
          end: {
            dateTime: new Date(rawEndTime).toISOString(),
            timeZone: timezone,
          },
          attendees: [{ email, displayName: inviteeName }],
          conferenceData: {
            createRequest: {
              requestId: `devschedule-${Date.now()}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        },
      });

      googleMeetLink = googleEvent.data.hangoutLink || null;
    } catch (error) {
      const googleError = await handleGoogleOperationError("Calendar", error);
      return failScheduling("google_calendar", googleError.status || 502, error, {
        hostId: hostProfile.id,
        errors,
        googleError,
      });
    }

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const sendGmail = async ({
      toEmail,
      subject,
      html,
    }: {
      toEmail: string;
      subject: string;
      html: string;
    }) =>
      gmail.users.messages.send({
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

    if (hostNotificationsEnabled) {
      try {
        await sendGmail({
          toEmail: hostEmail,
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
      } catch (error) {
        const googleError = await handleGoogleOperationError("Host email", error);
        return failScheduling("host_email", googleError.status || 502, error, {
          hostId: hostProfile.id,
          googleMeetLink,
          errors,
          googleError,
        });
      }
    }

    return sendJson(res, 200, {
      success: true,
      calendarStatus: "fulfilled",
      googleMeetLink,
      errors,
      emailStatus: [
        { type: "Invitee", status: "calendar_invite" },
        {
          type: "Host",
          status: hostNotificationsEnabled ? "fulfilled" : "skipped",
        },
      ],
    });
  } catch (error) {
    await notifySchedulingFailure({
      requestId,
      stage: "unhandled",
      status: 500,
      error,
      context: {},
    });
    return sendJson(res, 500, {
      error: GENERIC_SCHEDULING_ERROR,
      requestId,
    });
  }
}
