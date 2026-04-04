import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { db } from '../utils/db';
import { v4 as uuidv4 } from 'uuid';

const REQUEST_SELECT = `
  SELECT
    pr.*,
    r.name AS requester_name, r.thumbnail AS requester_thumbnail,
    o.name AS owner_name, o.thumbnail AS owner_thumbnail,
    s.date AS slot_date, s.start_time AS slot_start_time, s.end_time AS slot_end_time
  FROM playdate_requests pr
  JOIN users r ON r.id = pr.requester_id
  JOIN users o ON o.id = pr.owner_id
  JOIN availability_slots s ON s.id = pr.slot_id
`;

// GET /playdates/availability/:userId
export function getAvailability(req: AuthRequest, res: Response): void {
  const { userId } = req.params;
  const isSelf = req.userId === userId;

  const rows = isSelf
    ? db().prepare(
        'SELECT * FROM availability_slots WHERE user_id = ? ORDER BY date, start_time'
      ).all(userId)
    : db().prepare(
        "SELECT * FROM availability_slots WHERE user_id = ? AND status = 'free' ORDER BY date, start_time"
      ).all(userId);

  res.json(rows);
}

// POST /playdates/availability
export function addSlot(req: AuthRequest, res: Response): void {
  const { date, start_time, end_time, status = 'free', note } = req.body;
  const id = uuidv4();

  db().prepare(
    'INSERT INTO availability_slots (id, user_id, date, start_time, end_time, status, note) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, req.userId, date, start_time, end_time, status, note || null);

  const slot = db().prepare('SELECT * FROM availability_slots WHERE id = ?').get(id);
  res.status(201).json(slot);
}

// PUT /playdates/availability/:id
export function updateSlot(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const slot = db().prepare('SELECT * FROM availability_slots WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!slot) { res.status(404).json({ error: 'Slot not found' }); return; }
  if (slot.user_id !== req.userId) { res.status(403).json({ error: 'Forbidden' }); return; }

  const { date, start_time, end_time, status, note } = req.body;
  db().prepare(
    'UPDATE availability_slots SET date = ?, start_time = ?, end_time = ?, status = ?, note = ? WHERE id = ?'
  ).run(
    date ?? slot.date,
    start_time ?? slot.start_time,
    end_time ?? slot.end_time,
    status ?? slot.status,
    note !== undefined ? note : slot.note,
    id
  );

  res.json(db().prepare('SELECT * FROM availability_slots WHERE id = ?').get(id));
}

// DELETE /playdates/availability/:id
export function deleteSlot(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const slot = db().prepare('SELECT * FROM availability_slots WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!slot) { res.status(404).json({ error: 'Slot not found' }); return; }
  if (slot.user_id !== req.userId) { res.status(403).json({ error: 'Forbidden' }); return; }

  db().prepare('DELETE FROM availability_slots WHERE id = ?').run(id);
  res.json({ success: true });
}

// GET /playdates/requests
export function getRequests(req: AuthRequest, res: Response): void {
  const rows = db().prepare(
    `${REQUEST_SELECT} WHERE pr.requester_id = ? OR pr.owner_id = ? ORDER BY pr.created_at DESC`
  ).all(req.userId, req.userId);

  res.json(rows);
}

// POST /playdates/requests
export function createRequest(req: AuthRequest, res: Response): void {
  const { slotId, message } = req.body;

  const slot = db().prepare(
    "SELECT * FROM availability_slots WHERE id = ? AND status = 'free'"
  ).get(slotId) as Record<string, unknown> | undefined;

  if (!slot) { res.status(404).json({ error: 'Slot not found or not available' }); return; }
  if (slot.user_id === req.userId) { res.status(400).json({ error: 'Cannot request your own slot' }); return; }

  const existing = db().prepare(
    "SELECT id FROM playdate_requests WHERE requester_id = ? AND slot_id = ? AND status = 'pending'"
  ).get(req.userId, slotId);
  if (existing) { res.status(400).json({ error: 'You already have a pending request for this slot' }); return; }

  const id = uuidv4();
  db().prepare(
    'INSERT INTO playdate_requests (id, requester_id, owner_id, slot_id, message) VALUES (?, ?, ?, ?, ?)'
  ).run(id, req.userId, slot.user_id, slotId, message || null);

  res.status(201).json(db().prepare(`${REQUEST_SELECT} WHERE pr.id = ?`).get(id));
}

// PUT /playdates/requests/:id/respond
export function respondToRequest(req: AuthRequest, res: Response): void {
  const { id } = req.params;
  const { status } = req.body;

  const request = db().prepare('SELECT * FROM playdate_requests WHERE id = ?').get(id) as Record<string, unknown> | undefined;

  if (!request) { res.status(404).json({ error: 'Request not found' }); return; }
  if (request.owner_id !== req.userId) { res.status(403).json({ error: 'Forbidden' }); return; }
  if (request.status !== 'pending') { res.status(400).json({ error: 'Request already resolved' }); return; }

  db().prepare(
    "UPDATE playdate_requests SET status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(status, id);

  res.json(db().prepare(`${REQUEST_SELECT} WHERE pr.id = ?`).get(id));
}
