import nodemailer from "nodemailer";

const getEmailCredentials = () => {
  const emailUser = process.env.EMAIL_USER?.trim();
  const emailPass = process.env.EMAIL_PASS?.trim();

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be configured");
  }

  return { emailUser, emailPass };
};

export const sendOtpEmail = async (toEmail: string, otp: string) => {
  try {
    const { emailUser, emailPass } = getEmailCredentials();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.sendMail({
      from: `"DevSchedule" <${emailUser}>`,
      to: toEmail,
      subject: "Your DevSchedule verification code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">Verify your email</h1>
          <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px; color: #475569;">
            Use this one-time code to continue with DevSchedule.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 28px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #020617; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${otp}</span>
          </div>
          <p style="font-size: 13px; color: #64748b; margin: 0;">
            This code expires in 10 minutes. If you did not request it, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to send OTP email via Nodemailer: ${message}`);
  }
};
