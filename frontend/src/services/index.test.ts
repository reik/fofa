import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './api';
import { authService, userService, familyService, announcementService, playdateService, messageService } from './index';

const mockGet = vi.mocked(api.get);
const mockPost = vi.mocked(api.post);
const mockPut = vi.mocked(api.put);
const mockDelete = vi.mocked(api.delete);

function resolveWith(data: unknown) {
  return Promise.resolve({ data });
}

describe('authService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('login posts credentials and returns data', async () => {
    mockPost.mockResolvedValue({ data: { token: 'tok', user: {} } });
    const result = await authService.login('a@b.com', 'pass');
    expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'pass' });
    expect(result).toEqual({ token: 'tok', user: {} });
  });

  it('register posts registration data', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await authService.register({ email: 'a@b.com', password: 'pass', name: 'Ann', city: 'NYC', state: 'NY' });
    expect(mockPost).toHaveBeenCalledWith('/auth/register', expect.objectContaining({ email: 'a@b.com' }));
  });

  it('verifyEmail calls GET with token param', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await authService.verifyEmail('tok123');
    expect(mockGet).toHaveBeenCalledWith('/auth/verify-email', { params: { token: 'tok123' } });
  });

  it('forgotPassword posts email', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await authService.forgotPassword('a@b.com');
    expect(mockPost).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.com' });
  });

  it('resetPassword posts token and password', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await authService.resetPassword('tok', 'newpass');
    expect(mockPost).toHaveBeenCalledWith('/auth/reset-password', { token: 'tok', password: 'newpass' });
  });

  it('changePassword posts current and new passwords', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await authService.changePassword('old', 'new');
    expect(mockPost).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'old', newPassword: 'new' });
  });
});

describe('userService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getMe calls GET /users/me', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await userService.getMe();
    expect(mockGet).toHaveBeenCalledWith('/users/me');
  });

  it('search calls GET with query param', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await userService.search('Jane');
    expect(mockGet).toHaveBeenCalledWith('/users/search', { params: { q: 'Jane' } });
  });

  it('getById calls GET with user id', async () => {
    mockGet.mockResolvedValue({ data: {} });
    await userService.getById('u-1');
    expect(mockGet).toHaveBeenCalledWith('/users/u-1');
  });
});

describe('familyService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET /family', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await familyService.getAll();
    expect(mockGet).toHaveBeenCalledWith('/family');
  });

  it('remove calls DELETE with member id', async () => {
    mockDelete.mockResolvedValue({ data: {} });
    await familyService.remove('fm-1');
    expect(mockDelete).toHaveBeenCalledWith('/family/fm-1');
  });
});

describe('announcementService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll calls GET with page param', async () => {
    mockGet.mockResolvedValue({ data: { items: [], total: 0 } });
    await announcementService.getAll(2);
    expect(mockGet).toHaveBeenCalledWith('/announcements', { params: { page: 2 } });
  });

  it('toggleReaction posts type', async () => {
    mockPost.mockResolvedValue({ data: { action: 'added' } });
    await announcementService.toggleReaction('ann-1', 'like');
    expect(mockPost).toHaveBeenCalledWith('/announcements/ann-1/reactions', { type: 'like' });
  });

  it('addComment posts content', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await announcementService.addComment('ann-1', 'Nice!');
    expect(mockPost).toHaveBeenCalledWith('/announcements/ann-1/comments', { content: 'Nice!' });
  });

  it('deleteComment calls DELETE with correct path', async () => {
    mockDelete.mockResolvedValue({ data: {} });
    await announcementService.deleteComment('ann-1', 'c-1');
    expect(mockDelete).toHaveBeenCalledWith('/announcements/ann-1/comments/c-1');
  });
});

describe('playdateService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAvailability calls GET with userId', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await playdateService.getAvailability('u-1');
    expect(mockGet).toHaveBeenCalledWith('/playdates/availability/u-1');
  });

  it('createRequest posts slotId and message', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await playdateService.createRequest('slot-1', 'Let us meet!');
    expect(mockPost).toHaveBeenCalledWith('/playdates/requests', { slotId: 'slot-1', message: 'Let us meet!' });
  });

  it('respond calls PUT with status', async () => {
    mockPut.mockResolvedValue({ data: {} });
    await playdateService.respond('req-1', 'accepted');
    expect(mockPut).toHaveBeenCalledWith('/playdates/requests/req-1/respond', { status: 'accepted' });
  });
});

describe('messageService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getConversations calls GET /messages', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await messageService.getConversations();
    expect(mockGet).toHaveBeenCalledWith('/messages');
  });

  it('send posts receiverId and content', async () => {
    mockPost.mockResolvedValue({ data: {} });
    await messageService.send('u-2', 'Hello!');
    expect(mockPost).toHaveBeenCalledWith('/messages', { receiverId: 'u-2', content: 'Hello!' });
  });

  it('getUnreadCount calls GET /messages/unread/count', async () => {
    mockGet.mockResolvedValue({ data: { count: 5 } });
    const result = await messageService.getUnreadCount();
    expect(mockGet).toHaveBeenCalledWith('/messages/unread/count');
    expect(result).toEqual({ count: 5 });
  });
});
