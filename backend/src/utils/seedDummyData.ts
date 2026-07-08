import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from './db';

/**
 * Inserts a large demo dataset (20 families, family members, announcements,
 * comments, reactions, messages, availability + playdate requests) so an
 * empty environment looks alive. Idempotent: if the first demo user already
 * exists, it skips entirely — safe to leave running across restarts. All
 * seeded users share password `Password123!`.
 *
 * Thumbnails/photos use https://i.pravatar.cc and https://picsum.photos —
 * external placeholder image services — rather than local files, since
 * uploaded files on `backend/uploads/` are not guaranteed to persist across
 * deploys (ephemeral disks).
 */
export function seedDummyData(): void {
  const conn = db();

  const already = conn
    .prepare('SELECT 1 FROM users WHERE email = ?')
    .get('sarah.mitchell@email.com');
  if (already) {
    console.log('🌱 Dummy data already present — skipping seed');
    return;
  }

  const PASSWORD_HASH = bcrypt.hashSync('Password123!', 12);

  const daysAgo = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  };
  const atDate = (d: Date) => d.toISOString().replace('T', ' ').slice(0, 19);
  const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = <T,>(arr: T[]): T => arr[randInt(0, arr.length - 1)] as T;

  // ── Families (users) ───────────────────────────────────────────────────────
  const firstNames = [
    'Sarah', 'James', 'Maria', 'David', 'Linda', 'Tom', 'Priya', 'Carlos',
    'Emily', 'Marcus', 'Grace', 'Hassan', 'Olivia', 'Ben', 'Yuki', 'Fatima',
    'Ryan', 'Chloe', 'Ahmed', 'Natalie',
  ];
  const lastNames = [
    'Mitchell', 'Okafor', 'Santos', 'Chen', 'Washington', 'Bergman', 'Sharma', 'Ruiz',
    'Foster', 'Bennett', 'Kim', 'Malik', 'Reyes', 'Nakamura', 'Osei', 'Haddad',
    'Walsh', 'Dubois', 'Farah', 'Coleman',
  ];
  const cities: [string, string][] = [
    ['Austin', 'TX'], ['Atlanta', 'GA'], ['San Diego', 'CA'], ['Portland', 'OR'],
    ['Chicago', 'IL'], ['Denver', 'CO'], ['Seattle', 'WA'], ['Phoenix', 'AZ'],
    ['Raleigh', 'NC'], ['Boston', 'MA'], ['Minneapolis', 'MN'], ['Nashville', 'TN'],
    ['Columbus', 'OH'], ['Sacramento', 'CA'], ['Tampa', 'FL'], ['Salt Lake City', 'UT'],
    ['Kansas City', 'MO'], ['Richmond', 'VA'], ['Albuquerque', 'NM'], ['Boise', 'ID'],
  ];

  const FAMILY_COUNT = 20;
  const users = Array.from({ length: FAMILY_COUNT }, (_, i) => {
    const first = firstNames[i]!;
    const last = lastNames[i]!;
    const [city, state] = cities[i]!;
    return {
      id: uuid(),
      email: `${first.toLowerCase()}.${last.toLowerCase()}@email.com`,
      name: `${first} ${last}`,
      city,
      state,
      thumbnail: `https://i.pravatar.cc/300?img=${i + 1}`,
    };
  });

  const insertUser = conn.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, name, city, state, thumbnail, verified, created_at, updated_at)
    VALUES (@id, @email, @password, @name, @city, @state, @thumbnail, 1, @created_at, @updated_at)
  `);
  users.forEach((u, i) => {
    insertUser.run({ ...u, password: PASSWORD_HASH, created_at: daysAgo(200 - i * 2), updated_at: daysAgo(200 - i * 2) });
  });

  // ── Family members (1-6 per family) ─────────────────────────────────────────
  const childNames = [
    'Jake', 'Emma', 'Liam', 'Amara', 'Kofi', 'Sofia', 'Miguel', 'Isabella', 'Mei', 'Oliver',
    'Marcus', 'Nia', 'Ellie', 'Noah', 'Arjun', 'Leela', 'Mateo', 'Rosa', 'Diego', 'Ava',
    'Lucas', 'Zoe', 'Kai', 'Amara', 'Jonah', 'Ruby', 'Sam', 'Ines', 'Theo', 'Lily',
  ];
  const insertMember = conn.prepare(`
    INSERT OR IGNORE INTO family_members (id, user_id, name, age, thumbnail, created_at, updated_at)
    VALUES (@id, @user_id, @name, @age, @thumbnail, @created_at, @updated_at)
  `);
  let avatarSeed = 21; // offset from the 20 family-avatar images above
  users.forEach((u) => {
    const memberCount = randInt(1, 6);
    for (let i = 0; i < memberCount; i++) {
      insertMember.run({
        id: uuid(),
        user_id: u.id,
        name: pick(childNames),
        age: randInt(2, 17),
        thumbnail: `https://i.pravatar.cc/300?img=${avatarSeed++}`,
        created_at: daysAgo(randInt(30, 180)),
        updated_at: daysAgo(randInt(0, 30)),
      });
      if (avatarSeed > 70) avatarSeed = 21;
    }
  });

  // ── Announcements (1-50 per family, spread over the past 6 months) ─────────
  const postTemplates: ((n: string) => string)[] = [
    (n) => `Big milestone today 🎉 ${n} finally hit a goal we've been working toward for weeks. So proud!`,
    (n) => `${n} had a rough morning but we talked it through and ended the day laughing together. Small wins.`,
    () => `Reminder to everyone nearby — our monthly foster parent support group meets this Saturday. All welcome!`,
    (n) => `${n}'s school called with great news today. These kids never stop surprising me.`,
    () => `Does anyone have recommendations for a pediatric therapist who specializes in trauma? Would love referrals.`,
    (n) => `${n} asked me something last night that I'll be thinking about for a long time. 💙`,
    (n) => `${n} tried something brand new today and didn't want to stop. Love watching that confidence grow.`,
    () => `Quick tip for anyone doing school enrollment: bring the placement order and a caseworker letter — saves time.`,
    (n) => `Bio family visit went really well for ${n} today. Good days like this remind me why we support these connections.`,
    (n) => `${n} got their school photos back and loves them 📸 Ordering the big package this year.`,
    () => `Respite care win this week — if you haven't looked into respite yet, do it. You need the rest.`,
    (n) => `Annual review for ${n} went smoothly. Bringing organized notes on progress really does matter.`,
    (n) => `${n}'s IEP meeting is next week. Any tips from folks who've navigated these before?`,
    (n) => `Movie night with ${n} turned into a dance party. Exactly the kind of chaos we needed.`,
    (n) => `${n} made a new friend at the park today and it made my whole week.`,
  ];
  const insertAnnouncement = conn.prepare(`
    INSERT OR IGNORE INTO announcements (id, user_id, content, media_url, media_type, created_at, updated_at)
    VALUES (@id, @user_id, @content, @media_url, @media_type, @created_at, @updated_at)
  `);
  const announcementIds: { id: string; userId: string }[] = [];
  const SIX_MONTHS_DAYS = 182;
  users.forEach((u) => {
    const postCount = randInt(1, 50);
    const memberFirstName = pick(childNames);
    for (let i = 0; i < postCount; i++) {
      const id = uuid();
      const createdAt = daysAgo(randInt(0, SIX_MONTHS_DAYS));
      const hasPhoto = Math.random() < 0.35; // "some photos in the feeds"
      announcementIds.push({ id, userId: u.id });
      insertAnnouncement.run({
        id,
        user_id: u.id,
        content: pick(postTemplates)(memberFirstName),
        media_url: hasPhoto ? `https://picsum.photos/seed/${u.id}-${i}/800/600` : null,
        media_type: hasPhoto ? 'image' : null,
        created_at: createdAt,
        updated_at: createdAt,
      });
    }
  });

  // ── Comments (a handful on a random subset of posts) ────────────────────────
  const commentTemplates = [
    'This made me smile so much 💛',
    'Sending love to your whole family!',
    'These are the moments that make everything worth it.',
    'Thank you for sharing — needed to read this today.',
    'So proud of how far you all have come!',
    'Any tips on what worked for you? We could use the help.',
    'This community is the best. 🙏',
  ];
  const insertComment = conn.prepare(`
    INSERT OR IGNORE INTO comments (id, announcement_id, user_id, content, created_at, updated_at)
    VALUES (@id, @announcement_id, @user_id, @content, @created_at, @updated_at)
  `);
  const sampledForComments = announcementIds
    .slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(120, announcementIds.length));
  sampledForComments.forEach((a) => {
    const commentCount = randInt(0, 3);
    for (let i = 0; i < commentCount; i++) {
      const commenter = pick(users.filter((u) => u.id !== a.userId));
      const ts = daysAgo(randInt(0, SIX_MONTHS_DAYS));
      insertComment.run({
        id: uuid(),
        announcement_id: a.id,
        user_id: commenter.id,
        content: pick(commentTemplates),
        created_at: ts,
        updated_at: ts,
      });
    }
  });

  // ── Reactions (a handful per post, random subset) ───────────────────────────
  type ReactionType = 'like' | 'love' | 'hug' | 'celebrate' | 'support';
  const reactionTypes: ReactionType[] = ['like', 'love', 'hug', 'celebrate', 'support'];
  const insertReaction = conn.prepare(`
    INSERT OR IGNORE INTO reactions (id, announcement_id, user_id, type, created_at)
    VALUES (@id, @announcement_id, @user_id, @type, @created_at)
  `);
  announcementIds.forEach((a) => {
    if (Math.random() > 0.6) return; // not every post gets reactions
    const reactorCount = randInt(1, 6);
    const reactors = users.filter((u) => u.id !== a.userId).sort(() => Math.random() - 0.5).slice(0, reactorCount);
    reactors.forEach((r) => {
      insertReaction.run({
        id: uuid(),
        announcement_id: a.id,
        user_id: r.id,
        type: pick(reactionTypes),
        created_at: daysAgo(randInt(0, SIX_MONTHS_DAYS)),
      });
    });
  });

  // ── Messages (a few 2-person threads) ────────────────────────────────────────
  const messageOpeners = [
    'Hey! Saw your post — that made my day.',
    'How did the appointment go?',
    'Are you coming to the meetup this weekend?',
    'Thank you again for the advice last week, it really helped.',
    'Checking in — how is everyone settling in?',
  ];
  const insertMessage = conn.prepare(`
    INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, content, read, created_at)
    VALUES (@id, @sender_id, @receiver_id, @content, @read, @created_at)
  `);
  const shuffledUsers = users.slice().sort(() => Math.random() - 0.5);
  for (let i = 0; i < 8; i++) {
    const a = shuffledUsers[i * 2];
    const b = shuffledUsers[i * 2 + 1];
    if (!a || !b) break;
    const threadLength = randInt(2, 6);
    for (let m = 0; m < threadLength; m++) {
      const from = m % 2 === 0 ? a : b;
      const to = m % 2 === 0 ? b : a;
      insertMessage.run({
        id: uuid(),
        sender_id: from.id,
        receiver_id: to.id,
        content: m === 0 ? pick(messageOpeners) : 'Definitely — talk soon!',
        read: m === threadLength - 1 ? 0 : 1,
        created_at: daysAgo(randInt(0, 60)),
      });
    }
  }

  // ── Playdates: availability slots + requests, half of families, 1-8/month ──
  const playdateFamilies = users.filter((_, i) => i % 2 === 0); // 10 of the 20 families
  const insertSlot = conn.prepare(`
    INSERT OR IGNORE INTO availability_slots (id, user_id, date, start_time, end_time, status, note)
    VALUES (@id, @user_id, @date, @start_time, @end_time, @status, @note)
  `);
  const insertRequest = conn.prepare(`
    INSERT OR IGNORE INTO playdate_requests (id, requester_id, owner_id, slot_id, message, status, created_at, updated_at)
    VALUES (@id, @requester_id, @owner_id, @slot_id, @message, @status, @created_at, @updated_at)
  `);
  const playdateMessages = [
    'Would love to set up a playdate — does this time work?',
    'The kids have been asking to hang out again!',
    'We are free this weekend if you want to meet at the park.',
    null,
  ];
  const requestStatuses: ('pending' | 'accepted' | 'declined')[] = ['accepted', 'accepted', 'accepted', 'pending', 'declined'];

  for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
    playdateFamilies.forEach((owner) => {
      const slotsThisMonth = randInt(1, 8);
      for (let i = 0; i < slotsThisMonth; i++) {
        const slotDate = new Date();
        slotDate.setMonth(slotDate.getMonth() - monthOffset);
        slotDate.setDate(randInt(1, 28));
        const dateStr = slotDate.toISOString().slice(0, 10);
        const startHour = randInt(9, 16);

        const slotId = uuid();
        insertSlot.run({
          id: slotId,
          user_id: owner.id,
          date: dateStr,
          start_time: `${String(startHour).padStart(2, '0')}:00`,
          end_time: `${String(startHour + 1).padStart(2, '0')}:00`,
          status: 'free',
          note: null,
        });

        // ~70% of slots get an actual playdate request from another family
        if (Math.random() < 0.7) {
          const requester = pick(users.filter((u) => u.id !== owner.id));
          const status = pick(requestStatuses);
          const createdAt = atDate(slotDate);
          insertRequest.run({
            id: uuid(),
            requester_id: requester.id,
            owner_id: owner.id,
            slot_id: slotId,
            message: pick(playdateMessages),
            status,
            created_at: createdAt,
            updated_at: createdAt,
          });
          if (status !== 'pending') {
            conn.prepare("UPDATE availability_slots SET status = 'busy' WHERE id = ?").run(slotId);
          }
        }
      }
    });
  }

  const totalAnnouncements = announcementIds.length;
  console.log(
    `🌱 Dummy data seeded: ${users.length} families, ${totalAnnouncements} announcements, playdates for ${playdateFamilies.length} families (password: Password123!)`
  );
}
