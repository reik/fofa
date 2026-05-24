import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

/**
 * Seeds (or refreshes) a single verified account from ADMIN_EMAIL / ADMIN_PASSWORD
 * env vars. Email verification cannot complete on hosts that block outbound SMTP
 * (e.g. Render), so this guarantees a usable login. The env vars are the source of
 * truth: on every boot the account is created if missing, and if it already exists
 * its password is reset and `verified` is forced to 1 — so changing ADMIN_PASSWORD
 * and redeploying is a reliable password reset.
 */
export async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    return; // no admin configured — skip silently
  }

  const name = process.env.ADMIN_NAME?.trim() || 'Admin';
  const city = process.env.ADMIN_CITY?.trim() || 'N/A';
  const state = process.env.ADMIN_STATE?.trim() || 'N/A';
  const hashed = await bcrypt.hash(password, 12);

  const existing = db()
    .prepare('SELECT id FROM users WHERE email = ?')
    .get(email) as { id: string } | undefined;

  if (existing) {
    db()
      .prepare("UPDATE users SET password = ?, verified = 1, updated_at = datetime('now') WHERE id = ?")
      .run(hashed, existing.id);
    console.log(`✅ Admin account refreshed (verified): ${email}`);
  } else {
    db()
      .prepare(
        'INSERT INTO users (id, email, password, name, city, state, verified) VALUES (?, ?, ?, ?, ?, ?, 1)'
      )
      .run(uuidv4(), email, hashed, name, city, state);
    console.log(`✅ Admin account created (verified): ${email}`);
  }
}
