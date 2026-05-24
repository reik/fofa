import nodemailer from 'nodemailer';
import { lookup } from 'node:dns/promises';

const SMTP_HOST = 'smtp.gmail.com';

async function createTransport() {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    throw new Error(
      'Email not configured: GMAIL_USER and/or GMAIL_APP_PASSWORD env vars are missing'
    );
  }
  // Render has no public IPv6 route, so connecting to Gmail's IPv6 address fails
  // with ENETUNREACH. Resolve to IPv4 explicitly and pass the literal as host,
  // keeping `servername` so TLS/SNI cert validation still matches smtp.gmail.com.
  const { address } = await lookup(SMTP_HOST, { family: 4 });
  const port = Number(process.env.SMTP_PORT) || 465;
  return nodemailer.createTransport({
    host: address,
    port,
    secure: port === 465,
    tls: { servername: SMTP_HOST },
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Fail fast instead of hanging the request if SMTP is unreachable/blocked.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
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

  const transporter = await createTransport();
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

  const transporter = await createTransport();
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
