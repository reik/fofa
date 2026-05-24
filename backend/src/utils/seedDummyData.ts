import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { db } from './db';

/**
 * Inserts a fixed set of demo content (users, family members, announcements,
 * comments, reactions, messages) so an empty environment has something to show.
 * Idempotent: if the first demo user already exists, it skips entirely — safe to
 * leave running across restarts. All seeded users share password `Password123!`.
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
  const hoursAgo = (n: number) => {
    const d = new Date();
    d.setHours(d.getHours() - n);
    return d.toISOString().replace('T', ' ').slice(0, 19);
  };

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = [
    { id: uuid(), email: 'sarah.mitchell@email.com',  name: 'Sarah Mitchell',   city: 'Austin',    state: 'TX' },
    { id: uuid(), email: 'james.okafor@email.com',    name: 'James Okafor',     city: 'Atlanta',   state: 'GA' },
    { id: uuid(), email: 'maria.santos@email.com',    name: 'Maria Santos',     city: 'San Diego', state: 'CA' },
    { id: uuid(), email: 'david.chen@email.com',      name: 'David Chen',       city: 'Portland',  state: 'OR' },
    { id: uuid(), email: 'linda.washington@email.com',name: 'Linda Washington', city: 'Chicago',   state: 'IL' },
    { id: uuid(), email: 'tom.bergman@email.com',     name: 'Tom Bergman',      city: 'Denver',    state: 'CO' },
    { id: uuid(), email: 'priya.sharma@email.com',    name: 'Priya Sharma',     city: 'Seattle',   state: 'WA' },
    { id: uuid(), email: 'carlos.ruiz@email.com',     name: 'Carlos Ruiz',      city: 'Phoenix',   state: 'AZ' },
  ];

  const insertUser = conn.prepare(`
    INSERT OR IGNORE INTO users (id, email, password, name, city, state, verified, created_at, updated_at)
    VALUES (@id, @email, @password, @name, @city, @state, 1, @created_at, @updated_at)
  `);
  users.forEach((u, i) => {
    insertUser.run({ ...u, password: PASSWORD_HASH, created_at: daysAgo(30 - i * 2), updated_at: daysAgo(30 - i * 2) });
  });

  // ── Family Members ───────────────────────────────────────────────────────────
  const familyData = [
    { userId: 0, members: [{ name: 'Jake', age: 9 }, { name: 'Emma', age: 6 }, { name: 'Liam', age: 14 }] },
    { userId: 1, members: [{ name: 'Amara', age: 7 }, { name: 'Kofi', age: 11 }] },
    { userId: 2, members: [{ name: 'Sofia', age: 5 }, { name: 'Miguel', age: 8 }, { name: 'Isabella', age: 3 }] },
    { userId: 3, members: [{ name: 'Mei', age: 10 }, { name: 'Oliver', age: 13 }] },
    { userId: 4, members: [{ name: 'Marcus', age: 6 }, { name: 'Nia', age: 9 }] },
    { userId: 5, members: [{ name: 'Ellie', age: 4 }, { name: 'Noah', age: 7 }] },
    { userId: 6, members: [{ name: 'Arjun', age: 12 }, { name: 'Leela', age: 8 }] },
    { userId: 7, members: [{ name: 'Mateo', age: 5 }, { name: 'Rosa', age: 11 }, { name: 'Diego', age: 9 }] },
  ];
  const insertMember = conn.prepare(`
    INSERT OR IGNORE INTO family_members (id, user_id, name, age, created_at, updated_at)
    VALUES (@id, @user_id, @name, @age, @created_at, @updated_at)
  `);
  familyData.forEach(({ userId, members }) => {
    members.forEach((m, i) => {
      insertMember.run({
        id: uuid(),
        user_id: users[userId].id,
        name: m.name,
        age: m.age,
        created_at: daysAgo(25 - i),
        updated_at: daysAgo(25 - i),
      });
    });
  });

  // ── Announcements ─────────────────────────────────────────────────────────────
  const announcementData = [
    { userId: 0, content: "Big milestone today 🎉 Jake finally got his first A on a spelling test after we've been working on it for weeks. So proud of him! It's the small wins that keep us going.", daysBack: 1 },
    { userId: 1, content: "Reminder to everyone in the Atlanta area — the monthly foster parent support group meets this Saturday at 10am at Peachtree Community Center. All welcome! Bring snacks if you can 😊", daysBack: 2 },
    { userId: 2, content: "Sofia had her first dance recital today. She was SO nervous but absolutely crushed it. Three months ago she wouldn't even try. These kids never stop surprising me.", daysBack: 3 },
    { userId: 3, content: "Quick tip for anyone doing school enrollment: bring the placement order AND a letter from your caseworker on agency letterhead. Saved us 45 minutes of back-and-forth at the district office.", daysBack: 4 },
    { userId: 4, content: "Marcus asked me last night if he could call me 'Mom' instead of Linda. I held it together until after he fell asleep. 💙 Just needed to share that somewhere.", daysBack: 5 },
    { userId: 5, content: "Does anyone have recommendations for a pediatric therapist in Denver who specializes in trauma? Our caseworker gave us a list but would love personal referrals.", daysBack: 6 },
    { userId: 6, content: "Arjun got accepted into the school robotics team! He put together his application entirely on his own and didn't tell us until he got the acceptance email. Kid is going places 🤖", daysBack: 7 },
    { userId: 7, content: "Heads up: Mateo's school sent home a form about an 'emergency contact' that needs to be a non-foster-parent adult. Called our agency and apparently this is common — your caseworker can be listed. Sharing in case anyone else hits this.", daysBack: 8 },
    { userId: 0, content: "Anyone else dealing with major sleep regression after a placement transition? Emma is up 3-4 times a night. We've tried the night light, white noise... open to any suggestions at this point.", daysBack: 10 },
    { userId: 1, content: "Kofi's bio mom visit went really well today. She brought him his favorite snacks and they played board games for the whole two hours. Good days like this remind me why we support these connections.", daysBack: 11 },
    { userId: 3, content: "Mei got her school photos back and she loves them. She keeps showing them to everyone 📸 We're ordering the big package this year.", daysBack: 12 },
    { userId: 5, content: "Respite care win: found a wonderful couple through our agency who can take Noah and Ellie for a weekend next month. If you haven't looked into respite yet, do it — you need the rest.", daysBack: 14 },
    { userId: 2, content: "Update on the sibling group: all three are officially placed with us now. Miguel had a hard first week but we're settling into routines. Three kids under 9 is a lot but we wouldn't have it any other way.", daysBack: 16 },
    { userId: 6, content: "Annual review meeting with the caseworker went smoothly. Brought organized notes on school progress, medical appointments, and any incidents. If you're new to these reviews, preparation really does matter.", daysBack: 18 },
    { userId: 4, content: "Nia's IEP meeting is next week. Any tips from folks who've navigated these before? Particularly around requesting additional reading support.", daysBack: 20 },
  ];
  const insertAnnouncement = conn.prepare(`
    INSERT OR IGNORE INTO announcements (id, user_id, content, created_at, updated_at)
    VALUES (@id, @user_id, @content, @created_at, @updated_at)
  `);
  const announcementIds: string[] = [];
  announcementData.forEach((a) => {
    const id = uuid();
    announcementIds.push(id);
    insertAnnouncement.run({
      id,
      user_id: users[a.userId].id,
      content: a.content,
      created_at: daysAgo(a.daysBack),
      updated_at: daysAgo(a.daysBack),
    });
  });

  // ── Comments ──────────────────────────────────────────────────────────────────
  const commentData = [
    { annIdx: 0, userId: 1, content: "That's amazing Sarah! Celebrating every win is so important. Go Jake! 🙌", hoursBack: 22 },
    { annIdx: 0, userId: 4, content: "Love this. We had a similar breakthrough with Marcus on reading last month. Keep it up!", hoursBack: 20 },
    { annIdx: 0, userId: 6, content: "These are the moments that make everything worth it!", hoursBack: 18 },
    { annIdx: 1, userId: 0, content: "Thank you for the reminder! We'll be there 😊", hoursBack: 40 },
    { annIdx: 1, userId: 7, content: "Wish I was in Atlanta for this. Can you share notes afterward for those of us who can't make it?", hoursBack: 38 },
    { annIdx: 1, userId: 2, content: "James you're so good about organizing these. The community really appreciates it.", hoursBack: 36 },
    { annIdx: 2, userId: 3, content: "This made me tear up a little 😭 So wonderful to hear!", hoursBack: 60 },
    { annIdx: 2, userId: 5, content: "Dance is such great therapy honestly. Our kids love it too.", hoursBack: 58 },
    { annIdx: 3, userId: 7, content: "This is SO helpful — we have an enrollment coming up next month. Saving this!", hoursBack: 80 },
    { annIdx: 3, userId: 1, content: "I'd add: bring copies of everything. They always seem to need an extra copy.", hoursBack: 78 },
    { annIdx: 3, userId: 4, content: "Great tip. We also found it helped to call ahead and ask for the foster family liaison if the school has one.", hoursBack: 76 },
    { annIdx: 4, userId: 0, content: "Linda I am not crying, you are 💙", hoursBack: 110 },
    { annIdx: 4, userId: 2, content: "This is everything. Thank you for sharing.", hoursBack: 108 },
    { annIdx: 4, userId: 6, content: "That child is so lucky to have you ❤️", hoursBack: 105 },
    { annIdx: 4, userId: 7, content: "These are the moments 💙", hoursBack: 100 },
    { annIdx: 5, userId: 3, content: "We used Dr. Anita Patel in Capitol Hill — she's fantastic with trauma-informed care. I can send her contact info.", hoursBack: 130 },
    { annIdx: 5, userId: 1, content: "Also check with your agency — ours maintains a referral list with vetted providers.", hoursBack: 128 },
    { annIdx: 6, userId: 0, content: "Arjun is so impressive! That independent initiative is huge 🤖", hoursBack: 155 },
    { annIdx: 6, userId: 4, content: "Love seeing these kids thrive! Future engineer right there.", hoursBack: 153 },
    { annIdx: 8, userId: 2, content: "Oh we went through this with Sofia. A consistent 30-min wind-down routine with no screens helped most. Took about 3 weeks to stick.", hoursBack: 230 },
    { annIdx: 8, userId: 5, content: "Weighted blanket was a game changer for Noah. Worth trying!", hoursBack: 225 },
    { annIdx: 8, userId: 7, content: "Hang in there Sarah. Sleep deprivation is so hard. Does your agency offer any respite support?", hoursBack: 220 },
    { annIdx: 14, userId: 3, content: "Bring written notes and don't be afraid to ask for a break to review documents before signing. You have every right to take your time.", hoursBack: 460 },
    { annIdx: 14, userId: 0, content: "Also ask specifically about the reading specialist — sometimes they have one but don't proactively offer it.", hoursBack: 455 },
  ];
  const insertComment = conn.prepare(`
    INSERT OR IGNORE INTO comments (id, announcement_id, user_id, content, created_at, updated_at)
    VALUES (@id, @announcement_id, @user_id, @content, @created_at, @updated_at)
  `);
  commentData.forEach((c) => {
    const ts = hoursAgo(c.hoursBack);
    insertComment.run({
      id: uuid(),
      announcement_id: announcementIds[c.annIdx],
      user_id: users[c.userId].id,
      content: c.content,
      created_at: ts,
      updated_at: ts,
    });
  });

  // ── Reactions ─────────────────────────────────────────────────────────────────
  type ReactionType = 'like' | 'love' | 'hug' | 'celebrate' | 'support';
  const reactionData: { annIdx: number; userId: number; type: ReactionType }[] = [
    { annIdx: 0, userId: 1, type: 'celebrate' }, { annIdx: 0, userId: 2, type: 'celebrate' },
    { annIdx: 0, userId: 3, type: 'love' }, { annIdx: 0, userId: 4, type: 'like' },
    { annIdx: 0, userId: 5, type: 'celebrate' }, { annIdx: 0, userId: 6, type: 'love' },
    { annIdx: 1, userId: 0, type: 'like' }, { annIdx: 1, userId: 2, type: 'like' }, { annIdx: 1, userId: 5, type: 'like' },
    { annIdx: 2, userId: 0, type: 'love' }, { annIdx: 2, userId: 1, type: 'celebrate' }, { annIdx: 2, userId: 3, type: 'love' },
    { annIdx: 2, userId: 5, type: 'celebrate' }, { annIdx: 2, userId: 7, type: 'love' },
    { annIdx: 3, userId: 0, type: 'like' }, { annIdx: 3, userId: 2, type: 'like' }, { annIdx: 3, userId: 4, type: 'like' }, { annIdx: 3, userId: 5, type: 'like' },
    { annIdx: 4, userId: 0, type: 'love' }, { annIdx: 4, userId: 1, type: 'love' }, { annIdx: 4, userId: 2, type: 'love' },
    { annIdx: 4, userId: 3, type: 'love' }, { annIdx: 4, userId: 5, type: 'hug' }, { annIdx: 4, userId: 6, type: 'love' }, { annIdx: 4, userId: 7, type: 'love' },
    { annIdx: 5, userId: 0, type: 'support' }, { annIdx: 5, userId: 2, type: 'support' }, { annIdx: 5, userId: 7, type: 'like' },
    { annIdx: 6, userId: 0, type: 'celebrate' }, { annIdx: 6, userId: 1, type: 'celebrate' }, { annIdx: 6, userId: 2, type: 'celebrate' },
    { annIdx: 6, userId: 4, type: 'love' }, { annIdx: 6, userId: 7, type: 'celebrate' },
    { annIdx: 7, userId: 0, type: 'like' }, { annIdx: 7, userId: 3, type: 'like' }, { annIdx: 7, userId: 5, type: 'like' },
    { annIdx: 8, userId: 1, type: 'hug' }, { annIdx: 8, userId: 2, type: 'support' }, { annIdx: 8, userId: 3, type: 'hug' }, { annIdx: 8, userId: 4, type: 'support' },
    { annIdx: 9, userId: 0, type: 'love' }, { annIdx: 9, userId: 2, type: 'love' }, { annIdx: 9, userId: 4, type: 'celebrate' }, { annIdx: 9, userId: 6, type: 'support' },
    { annIdx: 12, userId: 0, type: 'love' }, { annIdx: 12, userId: 1, type: 'celebrate' }, { annIdx: 12, userId: 4, type: 'celebrate' },
    { annIdx: 12, userId: 6, type: 'love' }, { annIdx: 12, userId: 7, type: 'celebrate' },
    { annIdx: 14, userId: 0, type: 'support' }, { annIdx: 14, userId: 2, type: 'support' }, { annIdx: 14, userId: 3, type: 'like' }, { annIdx: 14, userId: 6, type: 'support' },
  ];
  const insertReaction = conn.prepare(`
    INSERT OR IGNORE INTO reactions (id, announcement_id, user_id, type, created_at)
    VALUES (@id, @announcement_id, @user_id, @type, @created_at)
  `);
  reactionData.forEach((r) => {
    insertReaction.run({
      id: uuid(),
      announcement_id: announcementIds[r.annIdx],
      user_id: users[r.userId].id,
      type: r.type,
      created_at: daysAgo(Math.floor(Math.random() * 3)),
    });
  });

  // ── Messages ──────────────────────────────────────────────────────────────────
  const messageThreads = [
    {
      participants: [0, 1],
      messages: [
        { from: 1, content: "Hey Sarah! Saw your post about Jake's spelling test. That's such great news!", hoursBack: 21 },
        { from: 0, content: "Thank you James! He worked so hard. I honestly teared up a bit 😂", hoursBack: 20 },
        { from: 1, content: "That's what it's all about. Have you guys been to any of the support group meetups?", hoursBack: 19 },
        { from: 0, content: "Not yet! I saw your post about Saturday — we're planning to come. Is it family-friendly or more parent-focused?", hoursBack: 18 },
        { from: 1, content: "Mostly parent-focused but kids are welcome if you need to bring them. We have a little activity area set up.", hoursBack: 17 },
      ],
    },
    {
      participants: [4, 5],
      messages: [
        { from: 5, content: "Linda, I saw your post about Marcus. That moment must have been incredible 💙", hoursBack: 100 },
        { from: 4, content: "Tom, I'm still not over it honestly. Some days are so hard and then one moment makes it all make sense.", hoursBack: 98 },
        { from: 5, content: "Completely understand. Noah called me 'Dad' last week and I didn't know whether to laugh or cry.", hoursBack: 96 },
        { from: 4, content: "BOTH. You do both. 😭 How is Noah settling in?", hoursBack: 94 },
        { from: 5, content: "Better each week. Still some nights that are rough but we're seeing real progress. The routine is helping.", hoursBack: 90 },
        { from: 4, content: "Routine is everything. What time do you do bedtime? We're trying to figure out what works for Marcus.", hoursBack: 85 },
        { from: 5, content: "7:30 for Ellie, 8:15 for Noah. Separate routines were key — they each needed their own wind-down time.", hoursBack: 80 },
      ],
    },
    {
      participants: [2, 6],
      messages: [
        { from: 6, content: "Maria! Congrats on the sibling group placement. Three under 9 is no joke 🙏", hoursBack: 380 },
        { from: 2, content: "Priya, it has been WILD. But we couldn't say no — keeping them together matters so much.", hoursBack: 375 },
        { from: 6, content: "100%. How is Miguel adjusting? The oldest in a new placement often has the hardest time.", hoursBack: 370 },
        { from: 2, content: "You nailed it. He's been protective of the little ones which is sweet but also means he's carrying a lot. Working with the caseworker on extra support for him.", hoursBack: 365 },
        { from: 6, content: "That protective instinct is so common. Does he have a therapist?", hoursBack: 360 },
        { from: 2, content: "Starting next week! Any tips for making that first session less intimidating?", hoursBack: 355 },
        { from: 6, content: "Arjun hated it at first. We framed it as 'talking to someone who's really good at helping kids sort out big feelings' — no pressure, no 'there's something wrong with you' vibe.", hoursBack: 350 },
        { from: 2, content: "That framing is perfect. Thank you so much for this 💛", hoursBack: 345 },
      ],
    },
    {
      participants: [3, 7],
      messages: [
        { from: 7, content: "David — your school enrollment tip was a lifesaver. We just went through enrollment and brought everything you said.", hoursBack: 190 },
        { from: 3, content: "Oh I'm so glad! Did it go smoothly?", hoursBack: 185 },
        { from: 7, content: "Much smoother than last time. They still gave us a bit of runaround but the agency letter shut it down fast.", hoursBack: 180 },
        { from: 3, content: "Classic. Every district is a little different but the letter always helps. Is Mateo settling into the new school?", hoursBack: 175 },
        { from: 7, content: "So far so good. He found a friend on the first day which was honestly the best sign.", hoursBack: 170 },
      ],
    },
  ];
  const insertMessage = conn.prepare(`
    INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, content, read, created_at)
    VALUES (@id, @sender_id, @receiver_id, @content, @read, @created_at)
  `);
  messageThreads.forEach((thread) => {
    const [a, b] = thread.participants;
    thread.messages.forEach((m, i) => {
      const isLast = i === thread.messages.length - 1;
      const senderId = users[m.from].id;
      const receiverId = m.from === a ? users[b].id : users[a].id;
      insertMessage.run({
        id: uuid(),
        sender_id: senderId,
        receiver_id: receiverId,
        content: m.content,
        read: isLast ? 0 : 1, // last message in each thread unread
        created_at: hoursAgo(m.hoursBack),
      });
    });
  });

  console.log(`🌱 Dummy data seeded: ${users.length} users, ${announcementData.length} announcements (password: Password123!)`);
}
