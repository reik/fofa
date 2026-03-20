import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export function getFamilyMembers(req: AuthRequest, res: Response): void {
  const members = db().prepare(
    'SELECT * FROM family_members WHERE user_id = ? ORDER BY name ASC'
  ).all(req.userId);
  res.json(members);
}

export function addFamilyMember(req: AuthRequest, res: Response): void {
  const { name, age } = req.body;
  const thumbnail = req.file
    ? `/uploads/thumbnails/${path.basename(req.file.path)}`
    : null;

  const id = uuidv4();
  db().prepare(
    'INSERT INTO family_members (id, user_id, name, age, thumbnail) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.userId, name, parseInt(age), thumbnail);

  const member = db().prepare('SELECT * FROM family_members WHERE id = ?').get(id);
  res.status(201).json(member);
}

export function updateFamilyMember(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { name, age } = req.body;
  const thumbnail = req.file
    ? `/uploads/thumbnails/${path.basename(req.file.path)}`
    : undefined;

  const member = db().prepare(
    'SELECT * FROM family_members WHERE id = ? AND user_id = ?'
  ).get(id, req.userId) as any;

  if (!member) { res.status(404).json({ error: 'Member not found' }); return; }

  const newThumbnail = thumbnail ?? member.thumbnail;

  db().prepare(
    `UPDATE family_members SET name = ?, age = ?, thumbnail = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(name || member.name, age ? parseInt(age) : member.age, newThumbnail, id);

  res.json(db().prepare('SELECT * FROM family_members WHERE id = ?').get(id));
}

export function deleteFamilyMember(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const result = db().prepare(
    'DELETE FROM family_members WHERE id = ? AND user_id = ?'
  ).run(id, req.userId);

  if (result.changes === 0) { res.status(404).json({ error: 'Member not found' }); return; }
  res.json({ message: 'Member removed' });
}
