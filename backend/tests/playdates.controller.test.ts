jest.mock('../src/utils/db');
jest.mock('uuid', () => ({ v4: () => 'generated-uuid' }));

import { db } from '../src/utils/db';
import {
  getAvailability,
  addSlot,
  updateSlot,
  deleteSlot,
  getRequests,
  createRequest,
  respondToRequest,
} from '../src/controllers/playdates.controller';
import { AuthRequest } from '../src/middleware/auth.middleware';
import { Response } from 'express';

const mockDb: any = { prepare: jest.fn() };
const mockStmt: any = { get: jest.fn(), run: jest.fn(), all: jest.fn() };
(db as jest.Mock).mockReturnValue(mockDb);
mockDb.prepare.mockReturnValue(mockStmt);

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Playdates Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAvailability', () => {
    it('returns all slots when viewing own availability', () => {
      const slots = [{ id: 's1', user_id: 'u1', status: 'busy' }];
      mockStmt.all.mockReturnValueOnce(slots);
      const req = { userId: 'u1', params: { userId: 'u1' } } as unknown as AuthRequest;
      const res = mockRes() as Response;

      getAvailability(req, res);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \* FROM availability_slots WHERE user_id = \? ORDER BY/)
      );
      expect(res.json).toHaveBeenCalledWith(slots);
    });

    it("returns only 'free' slots when viewing someone else's availability", () => {
      const slots = [{ id: 's1', user_id: 'u2', status: 'free' }];
      mockStmt.all.mockReturnValueOnce(slots);
      const req = { userId: 'u1', params: { userId: 'u2' } } as unknown as AuthRequest;
      const res = mockRes() as Response;

      getAvailability(req, res);

      expect(mockDb.prepare).toHaveBeenCalledWith(
        expect.stringContaining("status = 'free'")
      );
      expect(res.json).toHaveBeenCalledWith(slots);
    });
  });

  describe('addSlot', () => {
    it('inserts a slot and returns it with 201', () => {
      const created = { id: 'generated-uuid', user_id: 'u1', date: '2026-06-10', status: 'free' };
      mockStmt.get.mockReturnValueOnce(created);
      const req = {
        userId: 'u1',
        body: { date: '2026-06-10', start_time: '10:00', end_time: '12:00' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      addSlot(req, res);

      expect(mockStmt.run).toHaveBeenCalledWith(
        'generated-uuid',
        'u1',
        '2026-06-10',
        '10:00',
        '12:00',
        'free',
        null
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(created);
    });

    it('passes through note and custom status when provided', () => {
      mockStmt.get.mockReturnValueOnce({});
      const req = {
        userId: 'u1',
        body: {
          date: '2026-06-10',
          start_time: '10:00',
          end_time: '12:00',
          status: 'busy',
          note: 'soccer game',
        },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      addSlot(req, res);

      expect(mockStmt.run).toHaveBeenCalledWith(
        'generated-uuid',
        'u1',
        '2026-06-10',
        '10:00',
        '12:00',
        'busy',
        'soccer game'
      );
    });
  });

  describe('updateSlot', () => {
    it('returns 404 when the slot does not exist', () => {
      mockStmt.get.mockReturnValueOnce(undefined);
      const req = { userId: 'u1', params: { id: 'missing' }, body: {} } as unknown as AuthRequest;
      const res = mockRes() as Response;

      updateSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Slot not found' });
    });

    it('returns 403 when the slot belongs to another user', () => {
      mockStmt.get.mockReturnValueOnce({ id: 's1', user_id: 'someone-else' });
      const req = { userId: 'u1', params: { id: 's1' }, body: {} } as unknown as AuthRequest;
      const res = mockRes() as Response;

      updateSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' });
    });

    it('falls back to existing values for unspecified fields', () => {
      const existing = {
        id: 's1',
        user_id: 'u1',
        date: '2026-06-10',
        start_time: '10:00',
        end_time: '12:00',
        status: 'free',
        note: 'old',
      };
      mockStmt.get
        .mockReturnValueOnce(existing)
        .mockReturnValueOnce({ ...existing, status: 'busy' });
      const req = {
        userId: 'u1',
        params: { id: 's1' },
        body: { status: 'busy' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      updateSlot(req, res);

      expect(mockStmt.run).toHaveBeenCalledWith(
        '2026-06-10',
        '10:00',
        '12:00',
        'busy',
        'old',
        's1'
      );
      expect(res.json).toHaveBeenCalledWith({ ...existing, status: 'busy' });
    });

    it('clears the note when an explicit null is sent', () => {
      const existing = {
        id: 's1',
        user_id: 'u1',
        date: '2026-06-10',
        start_time: '10:00',
        end_time: '12:00',
        status: 'free',
        note: 'old',
      };
      mockStmt.get.mockReturnValueOnce(existing).mockReturnValueOnce({ ...existing, note: null });
      const req = {
        userId: 'u1',
        params: { id: 's1' },
        body: { note: null },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      updateSlot(req, res);

      const runCall = mockStmt.run.mock.calls[0];
      expect(runCall[4]).toBeNull();
    });
  });

  describe('deleteSlot', () => {
    it('returns 404 when the slot does not exist', () => {
      mockStmt.get.mockReturnValueOnce(undefined);
      const req = { userId: 'u1', params: { id: 'missing' } } as unknown as AuthRequest;
      const res = mockRes() as Response;

      deleteSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when the slot belongs to another user', () => {
      mockStmt.get.mockReturnValueOnce({ id: 's1', user_id: 'someone-else' });
      const req = { userId: 'u1', params: { id: 's1' } } as unknown as AuthRequest;
      const res = mockRes() as Response;

      deleteSlot(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('deletes the slot and reports success', () => {
      mockStmt.get.mockReturnValueOnce({ id: 's1', user_id: 'u1' });
      const req = { userId: 'u1', params: { id: 's1' } } as unknown as AuthRequest;
      const res = mockRes() as Response;

      deleteSlot(req, res);

      expect(mockStmt.run).toHaveBeenCalledWith('s1');
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('getRequests', () => {
    it('returns requests where the user is requester or owner', () => {
      const rows = [{ id: 'r1', requester_id: 'u1', owner_id: 'u2' }];
      mockStmt.all.mockReturnValueOnce(rows);
      const req = { userId: 'u1' } as AuthRequest;
      const res = mockRes() as Response;

      getRequests(req, res);

      expect(mockStmt.all).toHaveBeenCalledWith('u1', 'u1');
      expect(res.json).toHaveBeenCalledWith(rows);
    });
  });

  describe('createRequest', () => {
    it('returns 404 when the slot is missing or not free', () => {
      mockStmt.get.mockReturnValueOnce(undefined);
      const req = {
        userId: 'u1',
        body: { slotId: 'missing' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Slot not found or not available' });
    });

    it('returns 400 when requesting your own slot', () => {
      mockStmt.get.mockReturnValueOnce({ id: 's1', user_id: 'u1' });
      const req = {
        userId: 'u1',
        body: { slotId: 's1' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Cannot request your own slot' });
    });

    it('returns 400 when a pending request from this user already exists', () => {
      mockStmt.get
        .mockReturnValueOnce({ id: 's1', user_id: 'u2' })
        .mockReturnValueOnce({ id: 'existing-req' });
      const req = {
        userId: 'u1',
        body: { slotId: 's1' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      createRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'You already have a pending request for this slot',
      });
    });

    it('creates a pending request and returns it with 201', () => {
      const joinedRow = {
        id: 'generated-uuid',
        requester_id: 'u1',
        owner_id: 'u2',
        slot_id: 's1',
        status: 'pending',
        requester_name: 'Alice',
        owner_name: 'Bob',
      };
      mockStmt.get
        .mockReturnValueOnce({ id: 's1', user_id: 'u2' })
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce(joinedRow);

      const req = {
        userId: 'u1',
        body: { slotId: 's1', message: 'Would love to join!' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      createRequest(req, res);

      expect(mockStmt.run).toHaveBeenCalledWith(
        'generated-uuid',
        'u1',
        'u2',
        's1',
        'Would love to join!'
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(joinedRow);
    });

    it('persists null message when omitted', () => {
      mockStmt.get
        .mockReturnValueOnce({ id: 's1', user_id: 'u2' })
        .mockReturnValueOnce(undefined)
        .mockReturnValueOnce({});

      const req = {
        userId: 'u1',
        body: { slotId: 's1' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      createRequest(req, res);

      const runArgs = mockStmt.run.mock.calls[0];
      expect(runArgs[4]).toBeNull();
    });
  });

  describe('respondToRequest', () => {
    it('returns 404 when the request does not exist', () => {
      mockStmt.get.mockReturnValueOnce(undefined);
      const req = {
        userId: 'u2',
        params: { id: 'missing' },
        body: { status: 'accepted' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      respondToRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns 403 when the responder is not the slot owner', () => {
      mockStmt.get.mockReturnValueOnce({
        id: 'r1',
        owner_id: 'someone-else',
        status: 'pending',
      });
      const req = {
        userId: 'u2',
        params: { id: 'r1' },
        body: { status: 'accepted' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      respondToRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns 400 when the request is already resolved', () => {
      mockStmt.get.mockReturnValueOnce({
        id: 'r1',
        owner_id: 'u2',
        status: 'accepted',
      });
      const req = {
        userId: 'u2',
        params: { id: 'r1' },
        body: { status: 'declined' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      respondToRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Request already resolved' });
    });

    it('updates status and returns the joined request row', () => {
      const updatedRow = { id: 'r1', owner_id: 'u2', status: 'accepted', requester_name: 'A' };
      mockStmt.get
        .mockReturnValueOnce({ id: 'r1', owner_id: 'u2', status: 'pending' })
        .mockReturnValueOnce(updatedRow);
      const req = {
        userId: 'u2',
        params: { id: 'r1' },
        body: { status: 'accepted' },
      } as unknown as AuthRequest;
      const res = mockRes() as Response;

      respondToRequest(req, res);

      expect(mockStmt.run).toHaveBeenCalledWith('accepted', 'r1');
      expect(res.json).toHaveBeenCalledWith(updatedRow);
    });
  });
});
