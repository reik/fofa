jest.mock('../src/utils/db');

import { db } from '../src/utils/db';
import { getFamilyMembers, addFamilyMember, deleteFamilyMember } from '../src/controllers/family.controller';
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

describe('Family Controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getFamilyMembers returns list', () => {
    mockStmt.all.mockReturnValueOnce([{ id: 'm1', name: 'Alice', age: 8 }]);
    const req = { userId: 'u1' } as AuthRequest;
    const res = mockRes() as Response;
    getFamilyMembers(req, res);
    expect(res.json).toHaveBeenCalledWith([{ id: 'm1', name: 'Alice', age: 8 }]);
  });

  it('addFamilyMember creates member', () => {
    mockStmt.run.mockReturnValue({ changes: 1 });
    mockStmt.get.mockReturnValueOnce({ id: 'm2', name: 'Bob', age: 5, user_id: 'u1', thumbnail: null });
    const req = { userId: 'u1', body: { name: 'Bob', age: '5' }, file: undefined } as unknown as AuthRequest;
    const res = mockRes() as Response;
    addFamilyMember(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bob' }));
  });

  it('deleteFamilyMember returns 404 if not owned', () => {
    mockStmt.run.mockReturnValue({ changes: 0 });
    const req = { userId: 'u1', params: { id: 'other-member' } } as unknown as AuthRequest;
    const res = mockRes() as Response;
    deleteFamilyMember(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
