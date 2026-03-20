import express from "express";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import ical from "ical-generator";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for scheduling and sending email
  app.post("/api/schedule", async (req, res) => {
    const { name, email, eventTitle, startTime, endTime, timezone, whatsapp, automationType, rawStartTime, rawEndTime } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    try {
      // Configure nodemailer
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'sheikhsohrab618@gmail.com',
          pass: process.env.EMAIL_PASS,
        },
      });

      // Create Calendar Event
      const calendar = ical({ name: 'HVTech Meetings' });
      const event = calendar.createEvent({
        start: new Date(rawStartTime),
        end: new Date(rawEndTime),
        summary: eventTitle,
        description: `Discovery Meeting with Hv Technologies. \n\nAutomation Interests: ${automationType.join(', ') || 'None'} \nWhatsapp: ${whatsapp}`,
        location: 'Google Meet / Web Conference',
        url: 'https://hvtech.com',
        organizer: {
          name: 'Hv Technologies',
          email: 'sheikhsohrab618@gmail.com'
        },
        attendees: [
          { name, email, rsvp: true }
        ]
      });

      const mailOptions = {
        from: `"HVTech Invites" <${process.env.EMAIL_USER || 'sheikhsohrab618@gmail.com'}>`,
        to: email,
        subject: `Invitation: ${eventTitle} with Hv Technologies`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <div style="background-color: #000; padding: 20px; text-align: center;">
              <h1 style="color: #fff; margin: 0;">HVTech</h1>
            </div>
            <div style="padding: 40px;">
              <h2 style="color: #1a202c; margin-top: 0;">Hi ${name},</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
                Your meeting has been scheduled successfully! A calendar invite has been attached to this email.
              </p>
              
              <div style="background-color: #f7fafc; padding: 24px; border-radius: 8px; margin: 30px 0;">
                <h3 style="margin-top: 0; color: #2d3748;">${eventTitle}</h3>
                <p style="margin: 8px 0; color: #4a5568;"><strong>When:</strong> ${startTime} - ${endTime}</p>
                <p style="margin: 8px 0; color: #4a5568;"><strong>Timezone:</strong> ${timezone}</p>
                <p style="margin: 8px 0; color: #4a5568;"><strong>Location:</strong> Web conferencing details to follow</p>
              </div>

              <p style="color: #4a5568; font-size: 14px;">
                <strong>Automation Interests:</strong> ${automationType.join(', ') || 'None specified'}
              </p>
              
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                See you there!
              </p>
            </div>
            <div style="background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0;">
              Powered by HVTech
            </div>
          </div>
        `,
        icalEvent: {
          filename: 'invitation.ics',
          method: 'REQUEST',
          content: calendar.toString()
        }
      };

      await transporter.sendMail(mailOptions);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send invitation email." });
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
