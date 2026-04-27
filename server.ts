import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ical from "ical-generator";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

dotenv.config();

async function createGoogleCalendarEvent(eventData: any) {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    console.warn("Google Calendar credentials not fully configured. Skipping automatic calendar event creation.");
    return null;
  }

  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // Default for playground or your redirect URI
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: eventData.eventTitle,
    location: "Google Meet / Web Conference",
    description: `Discovery Meeting with Hv Technologies. \n\nAutomation Interests: ${eventData.automationType.join(', ') || 'None'} \nWhatsapp: ${eventData.whatsapp}`,
    start: {
      dateTime: new Date(eventData.rawStartTime).toISOString(),
    },
    end: {
      dateTime: new Date(eventData.rawEndTime).toISOString(),
    },
    attendees: [
      { email: eventData.email, displayName: eventData.name },
    ],
    conferenceData: {
      createRequest: {
        requestId: `meeting-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
    });
    return response.data;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return null;
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Supabase Admin client for verification codes
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // API Route for sending verification OTP
  app.post("/api/verification/send", async (req, res) => {
    const { email, meetingName } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Industry Standard: Store in Database (Supabase)
      const { error: dbError } = await supabaseAdmin
        .from('verification_codes')
        .insert([{ email, code, expires_at: expires.toISOString() }]);

      if (dbError) {
        console.error("Database error saving verification code:", dbError);
        // Fallback for this demo environment if table doesn't exist yet
        // In a real production app, the table must exist.
      }

      const emailUser = process.env.EMAIL_USER || 'sheikhsohrab618@gmail.com';
      const emailPass = process.env.EMAIL_PASS;

      // Formatting details for email
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const tz = 'Asia/Kolkata';
      const zonedDate = toZonedTime(new Date(), tz);
      const timestamp = format(zonedDate, "h:mmaaa - EEEE, MMMM d, yyyy") + " (India Standard Time)";

      if (!emailPass) {
        console.warn("EMAIL_PASS not configured. Logging OTP to console:", code);
        return res.json({ success: true, warning: "Email not sent due to missing configuration", debug_code: code });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      await transporter.sendMail({
        from: `"Calendly Clone" <${emailUser}>`,
        to: email,
        subject: "Your authentication code",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; padding: 20px;">
            <div style="padding: 24px 0; border-bottom: 2px dashed #e2e8f0; margin-bottom: 32px;">
              <h1 style="font-size: 28px; font-weight: 800; margin: 0; color: #000;">Your authentication code</h1>
            </div>
            
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 32px 0; color: #1a1a1a;">
              To confirm this email address is correct, copy and paste this code to complete the two factor authentication.
            </p>
            
            <div style="background-color: #f8faff; padding: 48px; text-align: center; border-radius: 4px; margin: 0 0 40px 0; border: 1px solid #edf2f7;">
              <span style="font-size: 42px; font-weight: 700; letter-spacing: 16px; color: #000; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${code}</span>
            </div>
            
            <div style="margin: 0 0 40px 0;">
              <h3 style="font-size: 18px; font-weight: 800; margin: 0 0 20px 0; color: #000;">Details about this login:</h3>
              
              <div style="margin-bottom: 16px;">
                <span style="font-size: 14px; font-weight: 800; display: block; margin-bottom: 4px; text-transform: none;">Meeting name</span>
                <span style="font-size: 15px; color: #1a1a1a;">${meetingName || 'Event Booking'}</span>
              </div>
              
              <div style="margin-bottom: 16px;">
                <span style="font-size: 14px; font-weight: 800; display: block; margin-bottom: 4px; text-transform: none;">IP</span>
                <span style="font-size: 15px; color: #1a1a1a;">${ip}</span>
              </div>
              
              <div style="margin-bottom: 16px;">
                <span style="font-size: 14px; font-weight: 800; display: block; margin-bottom: 4px; text-transform: none;">Timestamp</span>
                <span style="font-size: 15px; color: #1a1a1a;">${timestamp}</span>
              </div>
            </div>
            
            <div style="padding: 24px 0; border-top: 2px dashed #e2e8f0; border-bottom: 2px dashed #e2e8f0; margin-bottom: 32px;">
              <p style="font-size: 14px; margin: 0; color: #4a5568;">Note: this code is for one-time use and will expire in 10 minutes.</p>
            </div>
            
            <p style="font-size: 15px; color: #4a5568; margin: 0;">
              If you did not book this meeting, you can <a href="#" style="color: #006bff; text-decoration: none; font-weight: 700;">follow this link</a> to report the issue.
            </p>
          </div>
        `,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending verification email:", error);
      res.status(500).json({ error: "Failed to send verification email." });
    }
  });

  // API Route for verifying OTP
  app.post("/api/verification/verify", async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and code are required" });

    try {
      // Industry Standard: Verify from Database
      const { data, error } = await supabaseAdmin
        .from('verification_codes')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return res.status(400).json({ error: "Invalid verification code" });
      }

      if (new Date() > new Date(data.expires_at)) {
        return res.status(400).json({ error: "Verification code has expired" });
      }

      // Success - Delete used code
      await supabaseAdmin
        .from('verification_codes')
        .delete()
        .eq('email', email);

      res.json({ success: true });
    } catch (err) {
      console.error("Verification error:", err);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // API Route for scheduling and sending email
  app.post("/api/schedule", async (req, res) => {
    const { name, email, eventTitle, startTime, endTime, timezone, whatsapp, automationType, rawStartTime, rawEndTime, hostUsername } = req.body;
    const inviteeName = name || req.body.firstName || 'Invitee';

    console.log(`[Schedule API] New request for ${eventTitle} - Host: ${hostUsername}, Invitee: ${email} (${inviteeName})`);

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    try {
      const emailUser = process.env.EMAIL_USER || 'sheikhsohrab618@gmail.com';
      const emailPass = process.env.EMAIL_PASS;

      if (!emailPass) {
        console.warn("[Schedule API] EMAIL_PASS not configured. Skipping email invitation.");
        return res.json({ success: true, warning: "Email not sent due to missing configuration" });
      }

      const automationInterests = Array.isArray(automationType) ? automationType.join(', ') : 'None specified';
      const whatsappInfo = whatsapp || 'Not provided';

      // Fetch host profile settings and email
      let hostNotificationsEnabled = true;
      let hostEmail = emailUser; // Fallback to system email
      let hostDisplayName = "Host";

      try {
        if (hostUsername) {
          console.log(`[Schedule API] Fetching profile for host: ${hostUsername}`);
          const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('host_notifications_enabled, email, full_name')
            .eq('username', hostUsername)
            .single();
          
          if (profileError) {
            console.warn(`[Schedule API] Profile lookup error for ${hostUsername}:`, profileError.message);
          }

          if (profile) {
            console.log(`[Schedule API] Found profile: ${profile.full_name} (${profile.email})`);
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
            console.warn(`[Schedule API] No profile found for username: ${hostUsername}`);
          }
        }
      } catch (err) {
        console.warn("[Schedule API] Exception during profile fetching:", err);
      }

      // Create Google Calendar Event
      console.log("[Schedule API] Attempting to create Google Calendar event...");
      const googleEvent = await createGoogleCalendarEvent({
        name: inviteeName,
        email,
        eventTitle,
        startTime,
        endTime,
        timezone,
        whatsapp: whatsappInfo,
        automationType: Array.isArray(automationType) ? automationType : [],
        rawStartTime,
        rawEndTime
      });

      const hangoutsLink = googleEvent?.hangoutLink || 'Google Meet / Web Conference';
      const googleCalendarLink = googleEvent?.htmlLink || null;

      if (googleEvent) {
        console.log(`[Schedule API] Google Calendar event created: ${googleEvent.id}`);
      } else {
        console.log("[Schedule API] Google Calendar event creation skipped or failed.");
      }

      // Create Calendar Event (ICS)
      const calendar = ical({ name: 'Calendly Meetings' });
      calendar.createEvent({
        start: new Date(rawStartTime),
        end: new Date(rawEndTime),
        summary: `${eventTitle}: ${inviteeName} & ${hostDisplayName}`,
        description: `Meeting scheduled via Calendly Clone. \n\nInvitee: ${inviteeName} (${email})\nAutomation Interests: ${automationInterests} \nWhatsapp: ${whatsappInfo}`,
        location: hangoutsLink,
        organizer: {
          name: 'Calendly Clone',
          email: hostEmail
        },
        attendees: [
          { name: inviteeName, email: email, rsvp: true },
          { name: hostDisplayName, email: hostEmail, rsvp: true }
        ]
      });

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      });

      const inviteeMailOptions = {
        from: `"Calendly Clone" <${emailUser}>`,
        to: email,
        subject: `Invitation: ${eventTitle} with ${hostDisplayName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #006bff; padding: 25px; text-align: center;">
              <h1 style="color: #fff; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
            </div>
            <div style="padding: 40px; color: #1a1a1a;">
              <h2 style="margin-top: 0; color: #1a1a1a;">Hi ${inviteeName},</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                Your meeting for <strong>${eventTitle}</strong> with <strong>${hostDisplayName}</strong> has been successfully scheduled.
              </p>
              
              <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 30px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 18px;">Meeting Summary</h3>
                <p style="margin: 12px 0; color: #475569;"><strong>When:</strong> ${startTime}</p>
                <p style="margin: 12px 0; color: #475569;"><strong>Timezone:</strong> ${timezone}</p>
                <p style="margin: 12px 0; color: #475569;"><strong>Location:</strong> <a href="${hangoutsLink}" style="color: #006bff;">${hangoutsLink}</a></p>
              </div>

              ${googleCalendarLink ? `
              <div style="text-align: center; margin-top: 20px;">
                <a href="${googleCalendarLink}" style="display: inline-block; background-color: #ffffff; color: #1a73e8; padding: 12px 24px; border: 1px solid #dadce0; border-radius: 4px; font-weight: 500; text-decoration: none;">
                  View on Google Calendar
                </a>
              </div>
              ` : ''}
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                We've attached a calendar invitation to this email for your convenience.
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              Powered by Calendly Clone
            </div>
          </div>
        `,
        icalEvent: {
          filename: 'invitation.ics',
          method: 'REQUEST',
          content: calendar.toString()
        }
      };

      const hostMailOptions = {
        from: `"Calendly Clone" <${emailUser}>`,
        to: hostEmail,
        subject: `New Event: ${eventTitle} with ${inviteeName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
            <div style="background-color: #006bff; padding: 25px; text-align: center;"> <!-- Blue for host too -->
              <h1 style="color: #fff; margin: 0; font-size: 24px;">New Booking!</h1>
            </div>
            <div style="padding: 40px; color: #1a1a1a;">
              <h2 style="margin-top: 0; color: #1a1a1a;">Hello ${hostDisplayName}!</h2>
              <p style="font-size: 16px; line-height: 1.6; color: #475569;">
                A new meeting has been scheduled via your booking link.
              </p>
              
              <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin: 30px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 18px;">Attendee Details</h3>
                <p style="margin: 12px 0; color: #475569;"><strong>Name:</strong> ${inviteeName}</p>
                <p style="margin: 12px 0; color: #475569;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 12px 0; color: #475569;"><strong>WhatsApp:</strong> ${whatsappInfo}</p>
                
                <h3 style="margin-top: 24px; color: #0f172a; font-size: 18px;">Event Details</h3>
                <p style="margin: 12px 0; color: #475569;"><strong>Type:</strong> ${eventTitle}</p>
                <p style="margin: 12px 0; color: #475569;"><strong>Time:</strong> ${startTime}</p>
                <p style="margin: 12px 0; color: #475569;"><strong>Location:</strong> ${hangoutsLink}</p>
              </div>

              ${automationInterests !== 'None specified' ? `
              <p style="color: #475569; font-size: 14px;">
                <strong>Interests:</strong> ${automationInterests}
              </p>
              ` : ''}
            </div>
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              Powered by Calendly Clone
            </div>
          </div>
        `,
        icalEvent: {
          filename: 'invitation.ics',
          method: 'PUBLISH',
          content: calendar.toString()
        }
      };

      console.log(`[Schedule API] Sending emails... Invitee: ${email}, Host: ${hostEmail} (Notifications: ${hostNotificationsEnabled})`);
      
      const mailTasks = [
        { options: inviteeMailOptions, type: 'Invitee' }
      ];
      
      if (hostNotificationsEnabled) {
        mailTasks.push({ options: hostMailOptions, type: 'Host' });
      }

      const results = await Promise.allSettled(mailTasks.map(task => transporter.sendMail(task.options)));
      
      results.forEach((result, index) => {
        const taskType = mailTasks[index].type;
        if (result.status === 'fulfilled') {
          console.log(`[Schedule API] Successfully sent ${taskType} email.`);
        } else {
          console.error(`[Schedule API] Failed to send ${taskType} email:`, result.reason);
        }
      });

      res.json({ 
        success: true, 
        emailStatus: results.map((r, i) => ({ type: mailTasks[i].type, status: r.status }))
      });
    } catch (error) {
      console.error("[Schedule API] Fatal error in schedule route:", error);
      res.status(500).json({ error: "Internal server error during scheduling." });
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
