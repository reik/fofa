import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../utils/db';
import path from 'path';

export function getMe(req: AuthRequest, res: Response): void {
  const user = db().prepare(
    'SELECT id, email, name, city, state, thumbnail, verified, created_at FROM users WHERE id = ?'
  ).get(req.userId) as any;

  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
}

export function updateProfile(req: AuthRequest, res: Response): void {
  const { name, city, state } = req.body;
  const thumbnail = req.file
    ? `/uploads/thumbnails/${path.basename(req.file.path)}`
    : undefined;

  const current = db().prepare('SELECT thumbnail FROM users WHERE id = ?').get(req.userId) as any;
  if (!current) { res.status(404).json({ error: 'User not found' }); return; }

  const newThumbnail = thumbnail ?? current.thumbnail;

  db().prepare(
    'UPDATE users SET name = ?, city = ?, state = ?, thumbnail = ?, updated_at = datetime("now") WHERE id = ?'
  ).run(name, city, state, newThumbnail, req.userId);

  const updated = db().prepare(
    'SELECT id, email, name, city, state, thumbnail FROM users WHERE id = ?'
  ).get(req.userId);

  res.json(updated);
}

export function searchUsers(req: AuthRequest, res: Response): void {
  const { q } = req.query as { q: string };
  const term = `%${q || ''}%`;
  const users = db().prepare(
    'SELECT id, name, city, state, thumbnail FROM users WHERE verified = 1 AND (name LIKE ? OR city LIKE ? OR state LIKE ?) AND id != ? LIMIT 20'
  ).all(term, term, term, req.userId);
  res.json(users);
}

export function getUserById(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const user = db().prepare(
    'SELECT id, name, city, state, thumbnail FROM users WHERE id = ? AND verified = 1'
  ).get(id);
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
}
