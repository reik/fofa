import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../utils/db';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';

const TOKEN_EXPIRY_HOURS = 24;

function generateJwt(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, city, state } = req.body;

    const existing = db().prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    db().prepare(
      'INSERT INTO users (id, email, password, name, city, state) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, email.toLowerCase(), hashed, name, city, state);

    // Create email verification token
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 3600 * 1000).toISOString();
    db().prepare(
      'INSERT INTO email_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), userId, token, expiresAt);

    await sendVerificationEmail(email, name, token);

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query as { token: string };

  const row = db().prepare(
    'SELECT * FROM email_tokens WHERE token = ? AND used = 0 AND expires_at > datetime("now")'
  ).get(token) as { id: string; user_id: string } | undefined;

  if (!row) {
    res.status(400).json({ error: 'Invalid or expired verification link' });
    return;
  }

  db().transaction(() => {
    db().prepare('UPDATE users SET verified = 1 WHERE id = ?').run(row.user_id);
    db().prepare('UPDATE email_tokens SET used = 1 WHERE id = ?').run(row.id);
  })();

  res.json({ message: 'Email verified successfully' });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = db().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;
  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (!user.verified) {
    res.status(403).json({ error: 'Please verify your email before logging in' });
    return;
  }

  const token = generateJwt(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      city: user.city,
      state: user.state,
      thumbnail: user.thumbnail,
    },
  });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body;
  const user = db().prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as any;

  // Always return 200 to prevent email enumeration
  if (!user) {
    res.json({ message: 'If that email exists, a reset link has been sent' });
    return;
  }

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  db().prepare(
    'INSERT INTO password_reset_tokens (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).run(uuidv4(), user.id, token, expiresAt);

  await sendPasswordResetEmail(user.email, user.name, token);
  res.json({ message: 'If that email exists, a reset link has been sent' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body;

  const row = db().prepare(
    'SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0 AND expires_at > datetime("now")'
  ).get(token) as { id: string; user_id: string } | undefined;

  if (!row) {
    res.status(400).json({ error: 'Invalid or expired reset link' });
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  db().transaction(() => {
    db().prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, row.user_id);
    db().prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(row.id);
  })();

  res.json({ message: 'Password reset successfully' });
}
