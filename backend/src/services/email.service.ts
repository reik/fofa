import nodemailer from 'nodemailer';

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST] Verification email to ${to}: ${url}`);
    return;
  }

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"FoFa Community" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Welcome to FoFa – Verify your email',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #4f7c3f;">Welcome to FoFa, ${name}!</h2>
        <p>Thank you for joining the Foster Families community. Please verify your email address to get started.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f7c3f;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Verify Email
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px;">Link expires in 24 hours. If you did not sign up, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const url = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  if (process.env.NODE_ENV === 'test') {
    console.log(`[TEST] Reset email to ${to}: ${url}`);
    return;
  }

  const transporter = createTransport();
  await transporter.sendMail({
    from: `"FoFa Community" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'FoFa – Password Reset',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #4f7c3f;">Password Reset Request</h2>
        <p>Hi ${name}, we received a request to reset your FoFa password.</p>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background:#4f7c3f;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="margin-top:24px;color:#666;font-size:13px;">Link expires in 1 hour.</p>
      </div>
    `,
  });
}
