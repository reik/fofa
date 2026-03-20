import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

export function getConversations(req: AuthRequest, res: Response): void {
  const rows = db().prepare(`
    SELECT
      m.id, m.content, m.created_at, m.read,
      CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END AS partner_id,
      u.name AS partner_name, u.thumbnail AS partner_thumbnail,
      (SELECT COUNT(*) FROM messages WHERE sender_id = partner_id AND receiver_id = ? AND read = 0) AS unread_count
    FROM messages m
    JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
    WHERE m.id IN (
      SELECT MAX(id) FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY CASE WHEN sender_id < receiver_id THEN sender_id || receiver_id
                    ELSE receiver_id || sender_id END
    )
    ORDER BY m.created_at DESC
  `).all(req.userId, req.userId, req.userId, req.userId, req.userId);

  res.json(rows);
}

export function getMessages(req: AuthRequest, res: Response): void {
  const { partnerId } = req.params;
  const page = parseInt((req.query.page as string) || '1');
  const limit = 30;
  const offset = (page - 1) * limit;

  // Mark messages as read
  db().prepare(
    'UPDATE messages SET read = 1 WHERE sender_id = ? AND receiver_id = ?'
  ).run(partnerId, req.userId);

  const messages = db().prepare(`
    SELECT m.*, u.name AS sender_name, u.thumbnail AS sender_thumbnail
    FROM messages m JOIN users u ON u.id = m.sender_id
    WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
    ORDER BY m.created_at DESC LIMIT ? OFFSET ?
  `).all(req.userId, partnerId, partnerId, req.userId, limit, offset);

  res.json(messages.reverse());
}

export function sendMessage(req: AuthRequest, res: Response): void {
  const { receiverId, content } = req.body;

  const receiver = db().prepare('SELECT id FROM users WHERE id = ? AND verified = 1').get(receiverId);
  if (!receiver) { res.status(404).json({ error: 'Recipient not found' }); return; }

  const id = uuidv4();
  db().prepare(
    'INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)'
  ).run(id, req.userId, receiverId, content);

  const message = db().prepare(`
    SELECT m.*, u.name AS sender_name, u.thumbnail AS sender_thumbnail
    FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?
  `).get(id);

  res.status(201).json(message);
}

export function getUnreadCount(req: AuthRequest, res: Response): void {
  const row = db().prepare(
    'SELECT COUNT(*) AS count FROM messages WHERE receiver_id = ? AND read = 0'
  ).get(req.userId) as { count: number };
  res.json({ count: row.count });
}
