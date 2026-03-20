import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Mock modules before imports
jest.mock('../src/utils/db');
jest.mock('../src/services/email.service');

import { db } from '../src/utils/db';
import { sendVerificationEmail } from '../src/services/email.service';

const mockDb = {
  prepare: jest.fn(),
};
const mockStmt = {
  get: jest.fn(),
  run: jest.fn(),
  all: jest.fn(),
};

(db as jest.Mock).mockReturnValue(mockDb);
mockDb.prepare.mockReturnValue(mockStmt);

// Import after mocks
import { register, login, verifyEmail } from '../src/controllers/auth.controller';
import { Request, Response } from 'express';

function mockRes(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Auth Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('returns 409 if email already exists', async () => {
      mockStmt.get.mockReturnValueOnce({ id: 'existing' });
      const req = { body: { email: 'test@test.com', password: 'password123', name: 'Jane', city: 'LA', state: 'CA' } } as Request;
      const res = mockRes() as Response;
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('creates user and sends verification email on success', async () => {
      mockStmt.get.mockReturnValueOnce(null); // no existing user
      mockStmt.run.mockReturnValue({ changes: 1 });
      (sendVerificationEmail as jest.Mock).mockResolvedValue(undefined);

      const req = { body: { email: 'new@test.com', password: 'password123', name: 'Jane', city: 'LA', state: 'CA' } } as Request;
      const res = mockRes() as Response;
      await register(req, res);
      expect(sendVerificationEmail).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('login', () => {
    it('returns 401 if user not found', async () => {
      mockStmt.get.mockReturnValueOnce(null);
      const req = { body: { email: 'missing@test.com', password: 'abc' } } as Request;
      const res = mockRes() as Response;
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns 403 if email not verified', async () => {
      const hashed = await bcrypt.hash('password123', 1);
      mockStmt.get.mockReturnValueOnce({ id: '1', email: 'test@test.com', password: hashed, verified: 0 });
      const req = { body: { email: 'test@test.com', password: 'password123' } } as Request;
      const res = mockRes() as Response;
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('returns token on valid credentials', async () => {
      const hashed = await bcrypt.hash('password123', 1);
      mockStmt.get.mockReturnValueOnce({
        id: 'u1', email: 'test@test.com', password: hashed, verified: 1,
        name: 'Jane', city: 'LA', state: 'CA', thumbnail: null,
      });
      process.env.JWT_SECRET = 'test-secret';
      const req = { body: { email: 'test@test.com', password: 'password123' } } as Request;
      const res = mockRes() as Response;
      await login(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ token: expect.any(String) }));
    });
  });

  describe('verifyEmail', () => {
    it('returns 400 for invalid token', async () => {
      mockStmt.get.mockReturnValueOnce(undefined);
      const req = { query: { token: 'bad-token' } } as unknown as Request;
      const res = mockRes() as Response;
      await verifyEmail(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
