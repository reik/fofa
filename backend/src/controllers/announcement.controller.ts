import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

interface Announcement {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_thumbnail: string | null;
  comment_count: number;
  reactions: string;
  user_reaction: string | null;
}

function formatAnnouncement(row: Announcement, userId: string) {
  let reactions: Record<string, number> = {};
  try { reactions = JSON.parse(row.reactions || '{}'); } catch { /* empty */ }

  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    mediaUrl: row.media_url,
    mediaType: row.media_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: { name: row.author_name, thumbnail: row.author_thumbnail },
    commentCount: row.comment_count,
    reactions,
    userReaction: row.user_reaction || null,
  };
}

export function getAnnouncements(req: AuthRequest, res: Response): void {
  const page = parseInt((req.query.page as string) || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const rows = db().prepare(`
    SELECT
      a.*,
      u.name  AS author_name,
      u.thumbnail AS author_thumbnail,
      (SELECT COUNT(*) FROM comments c WHERE c.announcement_id = a.id) AS comment_count,
      (SELECT json_group_object(type, cnt)
         FROM (SELECT type, COUNT(*) AS cnt FROM reactions r WHERE r.announcement_id = a.id GROUP BY type)
      ) AS reactions,
      (SELECT type FROM reactions r WHERE r.announcement_id = a.id AND r.user_id = ?) AS user_reaction
    FROM announcements a
    JOIN users u ON u.id = a.user_id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(req.userId, limit, offset) as Announcement[];

  const total = (db().prepare('SELECT COUNT(*) AS n FROM announcements').get() as { n: number }).n;

  res.json({
    data: rows.map((r) => formatAnnouncement(r, req.userId!)),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}

export function createAnnouncement(req: AuthRequest, res: Response): void {
  const { content } = req.body;
  const id = uuidv4();

  let mediaUrl: string | null = null;
  let mediaType: string | null = null;

  if (req.file) {
    mediaUrl = `/uploads/media/${path.basename(req.file.path)}`;
    const ext = path.extname(req.file.originalname).toLowerCase();
    mediaType = ['.mp4', '.mov', '.webm'].includes(ext) ? 'video' : 'image';
  }

  db().prepare(
    'INSERT INTO announcements (id, user_id, content, media_url, media_type) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.userId, content, mediaUrl, mediaType);

  const row = db().prepare(`
    SELECT a.*, u.name AS author_name, u.thumbnail AS author_thumbnail,
      0 AS comment_count, '{}' AS reactions, NULL AS user_reaction
    FROM announcements a JOIN users u ON u.id = a.user_id WHERE a.id = ?
  `).get(id) as Announcement;

  res.status(201).json(formatAnnouncement(row, req.userId!));
}

export function updateAnnouncement(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { content } = req.body;

  const ann = db().prepare('SELECT * FROM announcements WHERE id = ? AND user_id = ?').get(id, req.userId);
  if (!ann) { res.status(404).json({ error: 'Announcement not found' }); return; }

  db().prepare(
    `UPDATE announcements SET content = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(content, id);

  res.json({ message: 'Updated' });
}

export function deleteAnnouncement(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const result = db().prepare('DELETE FROM announcements WHERE id = ? AND user_id = ?').run(id, req.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Announcement not found' }); return; }
  res.json({ message: 'Deleted' });
}

// Comments
export function getComments(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const comments = db().prepare(`
    SELECT c.*, u.name AS author_name, u.thumbnail AS author_thumbnail
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.announcement_id = ? ORDER BY c.created_at ASC
  `).all(id);
  res.json(comments);
}

export function addComment(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { content } = req.body;

  const ann = db().prepare('SELECT id FROM announcements WHERE id = ?').get(id);
  if (!ann) { res.status(404).json({ error: 'Announcement not found' }); return; }

  const commentId = uuidv4();
  db().prepare(
    'INSERT INTO comments (id, announcement_id, user_id, content) VALUES (?, ?, ?, ?)'
  ).run(commentId, id, req.userId, content);

  const comment = db().prepare(`
    SELECT c.*, u.name AS author_name, u.thumbnail AS author_thumbnail
    FROM comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?
  `).get(commentId);

  res.status(201).json(comment);
}

export function deleteComment(req: AuthRequest, res: Response): void {
  const { commentId } = req.params;
  const result = db().prepare('DELETE FROM comments WHERE id = ? AND user_id = ?').run(commentId, req.userId);
  if (result.changes === 0) { res.status(404).json({ error: 'Comment not found' }); return; }
  res.json({ message: 'Comment deleted' });
}

// Reactions
export function toggleReaction(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { type } = req.body;

  const validTypes = ['like', 'love', 'hug', 'celebrate', 'support'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: 'Invalid reaction type' });
    return;
  }

  const existing = db().prepare(
    'SELECT * FROM reactions WHERE announcement_id = ? AND user_id = ?'
  ).get(id, req.userId) as any;

  if (existing) {
    if (existing.type === type) {
      // Remove reaction
      db().prepare('DELETE FROM reactions WHERE id = ?').run(existing.id);
      res.json({ action: 'removed', type });
    } else {
      // Change reaction
      db().prepare('UPDATE reactions SET type = ? WHERE id = ?').run(type, existing.id);
      res.json({ action: 'changed', type });
    }
  } else {
    db().prepare(
      'INSERT INTO reactions (id, announcement_id, user_id, type) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), id, req.userId, type);
    res.json({ action: 'added', type });
  }
}
