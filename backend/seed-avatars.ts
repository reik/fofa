import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.resolve('./fofa.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// DiceBear v9 — no API key, free, deterministic by seed
const avatar = (style: string, seed: string) =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&radius=50`;

// ── Users ─────────────────────────────────────────────────────────────────────

const userAvatars: Record<string, string> = {
  'sarah.mitchell@email.com': avatar('avataaars', 'SarahMitchell'),
  'james.okafor@email.com':   avatar('avataaars', 'JamesOkafor'),
  'maria.santos@email.com':   avatar('avataaars', 'MariaSantos'),
  'david.chen@email.com':     avatar('avataaars', 'DavidChen'),
  'linda.washington@email.com': avatar('avataaars', 'LindaWashington'),
  'tom.bergman@email.com':    avatar('avataaars', 'TomBergman'),
  'priya.sharma@email.com':   avatar('avataaars', 'PriyaSharma'),
  'carlos.ruiz@email.com':    avatar('avataaars', 'CarlosRuiz'),
};

const updateUser = db.prepare('UPDATE users SET thumbnail = ? WHERE email = ?');
let userCount = 0;
for (const [email, url] of Object.entries(userAvatars)) {
  const result = updateUser.run(url, email);
  userCount += result.changes;
}
console.log(`✅ Updated ${userCount} user avatars`);

// ── Family members ────────────────────────────────────────────────────────────

// fun-emoji style works great for kids
const familyAvatars: Record<string, string> = {
  'Jake':     avatar('fun-emoji', 'Jake'),
  'Emma':     avatar('fun-emoji', 'Emma'),
  'Liam':     avatar('fun-emoji', 'Liam'),
  'Amara':    avatar('fun-emoji', 'Amara'),
  'Kofi':     avatar('fun-emoji', 'Kofi'),
  'Sofia':    avatar('fun-emoji', 'Sofia'),
  'Miguel':   avatar('fun-emoji', 'Miguel'),
  'Isabella': avatar('fun-emoji', 'Isabella'),
  'Mei':      avatar('fun-emoji', 'Mei'),
  'Oliver':   avatar('fun-emoji', 'Oliver'),
  'Marcus':   avatar('fun-emoji', 'Marcus'),
  'Nia':      avatar('fun-emoji', 'Nia'),
  'Ellie':    avatar('fun-emoji', 'Ellie'),
  'Noah':     avatar('fun-emoji', 'Noah'),
  'Arjun':    avatar('fun-emoji', 'Arjun'),
  'Leela':    avatar('fun-emoji', 'Leela'),
  'Mateo':    avatar('fun-emoji', 'Mateo'),
  'Rosa':     avatar('fun-emoji', 'Rosa'),
  'Diego':    avatar('fun-emoji', 'Diego'),
};

const updateMember = db.prepare('UPDATE family_members SET thumbnail = ? WHERE name = ?');
let memberCount = 0;
for (const [name, url] of Object.entries(familyAvatars)) {
  const result = updateMember.run(url, name);
  memberCount += result.changes;
}
console.log(`✅ Updated ${memberCount} family member avatars`);

db.close();
console.log('\n🎨 Avatar update complete!');
