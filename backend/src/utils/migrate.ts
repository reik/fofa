import Database from 'better-sqlite3';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || './fofa.db';

export function getDb(): Database.Database {
  const db = new Database(path.resolve(DB_PATH));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export function runMigrations(): void {
  const db = getDb();

  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      name        TEXT NOT NULL,
      city        TEXT NOT NULL,
      state       TEXT NOT NULL,
      thumbnail   TEXT,
      verified    INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Email verification tokens
    CREATE TABLE IF NOT EXISTS email_tokens (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT UNIQUE NOT NULL,
      expires_at  TEXT NOT NULL,
      used        INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Password reset tokens
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT UNIQUE NOT NULL,
      expires_at  TEXT NOT NULL,
      used        INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Family members
    CREATE TABLE IF NOT EXISTS family_members (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT NOT NULL,
      age         INTEGER NOT NULL,
      thumbnail   TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content     TEXT NOT NULL,
      media_url   TEXT,
      media_type  TEXT CHECK(media_type IN ('image', 'video', NULL)),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Comments on announcements
    CREATE TABLE IF NOT EXISTS comments (
      id              TEXT PRIMARY KEY,
      announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content         TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Reactions on announcements
    CREATE TABLE IF NOT EXISTS reactions (
      id              TEXT PRIMARY KEY,
      announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
      user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type            TEXT NOT NULL CHECK(type IN ('like','love','hug','celebrate','support')),
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(announcement_id, user_id)
    );

    -- Direct messages
    CREATE TABLE IF NOT EXISTS messages (
      id          TEXT PRIMARY KEY,
      sender_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content     TEXT NOT NULL,
      read        INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_announcements_user    ON announcements(user_id);
    CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_announcement ON comments(announcement_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_announcement ON reactions(announcement_id);
    CREATE INDEX IF NOT EXISTS idx_messages_sender       ON messages(sender_id);
    CREATE INDEX IF NOT EXISTS idx_messages_receiver     ON messages(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_family_user           ON family_members(user_id);
  `);

  console.log('✅ Database migrations complete');
  db.close();
}

// Run directly
if (require.main === module) {
  runMigrations();
}
