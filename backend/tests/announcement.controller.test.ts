jest.mock('../src/utils/db');

import { db } from '../src/utils/db';
import { getAnnouncements, createAnnouncement, toggleReaction, addComment } from '../src/controllers/announcement.controller';
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

function mockReq(overrides = {}): Partial<AuthRequest> {
  return { userId: 'user-1', query: {}, params: {}, body: {}, ...overrides };
}

describe('Announcement Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getAnnouncements', () => {
    it('returns paginated announcements', () => {
      mockStmt.all.mockReturnValueOnce([
        {
          id: 'a1', user_id: 'user-1', content: 'Hello!', media_url: null, media_type: null,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
          author_name: 'Jane', author_thumbnail: null, comment_count: 0,
          reactions: '{}', user_reaction: null,
        },
      ]);
      mockStmt.get.mockReturnValueOnce({ n: 1 });

      const req = mockReq({ query: { page: '1' } }) as AuthRequest;
      const res = mockRes() as Response;
      getAnnouncements(req, res);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.any(Array), pagination: expect.any(Object) })
      );
    });
  });

  describe('createAnnouncement', () => {
    it('creates and returns new announcement', () => {
      mockStmt.run.mockReturnValue({ changes: 1 });
      mockStmt.get.mockReturnValueOnce({
        id: 'a2', user_id: 'user-1', content: 'Test post', media_url: null, media_type: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        author_name: 'Jane', author_thumbnail: null, comment_count: 0,
        reactions: '{}', user_reaction: null,
      });

      const req = mockReq({ body: { content: 'Test post' }, file: undefined }) as AuthRequest;
      const res = mockRes() as Response;
      createAnnouncement(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('toggleReaction', () => {
    it('returns 400 for invalid reaction type', () => {
      const req = mockReq({ params: { id: 'a1' }, body: { type: 'angry' } }) as AuthRequest;
      const res = mockRes() as Response;
      toggleReaction(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('adds reaction when none exists', () => {
      mockStmt.get.mockReturnValueOnce(null); // no existing reaction
      mockStmt.run.mockReturnValue({ changes: 1 });
      const req = mockReq({ params: { id: 'a1' }, body: { type: 'like' } }) as AuthRequest;
      const res = mockRes() as Response;
      toggleReaction(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ action: 'added' }));
    });

    it('removes reaction when same type clicked again', () => {
      mockStmt.get.mockReturnValueOnce({ id: 'r1', type: 'like' });
      mockStmt.run.mockReturnValue({ changes: 1 });
      const req = mockReq({ params: { id: 'a1' }, body: { type: 'like' } }) as AuthRequest;
      const res = mockRes() as Response;
      toggleReaction(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ action: 'removed' }));
    });
  });

  describe('addComment', () => {
    it('returns 404 if announcement not found', () => {
      mockStmt.get.mockReturnValueOnce(null);
      const req = mockReq({ params: { id: 'bad-id' }, body: { content: 'Nice!' } }) as AuthRequest;
      const res = mockRes() as Response;
      addComment(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
