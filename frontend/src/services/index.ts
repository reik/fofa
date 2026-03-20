import api from './api';
import {
  User, FamilyMember, Announcement, Comment,
  Message, Conversation, PaginatedResponse, ReactionType
} from '../types';

// ── Auth ──────────────────────────────────────────────────────────
export const authService = {
  register: (data: { email: string; password: string; name: string; city: string; state: string }) =>
    api.post('/auth/register', data).then(r => r.data),

  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }).then(r => r.data),

  verifyEmail: (token: string) =>
    api.get('/auth/verify-email', { params: { token } }).then(r => r.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),

  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }).then(r => r.data),
};

// ── User ──────────────────────────────────────────────────────────
export const userService = {
  getMe: () => api.get<User>('/users/me').then(r => r.data),

  updateProfile: (formData: FormData) =>
    api.put<User>('/users/me', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  search: (q: string) =>
    api.get<User[]>('/users/search', { params: { q } }).then(r => r.data),

  getById: (id: string) =>
    api.get<User>(`/users/${id}`).then(r => r.data),
};

// ── Family ────────────────────────────────────────────────────────
export const familyService = {
  getAll: () => api.get<FamilyMember[]>('/family').then(r => r.data),

  add: (formData: FormData) =>
    api.post<FamilyMember>('/family', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  update: (id: string, formData: FormData) =>
    api.put<FamilyMember>(`/family/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/family/${id}`).then(r => r.data),
};

// ── Announcements ─────────────────────────────────────────────────
export const announcementService = {
  getAll: (page = 1) =>
    api.get<PaginatedResponse<Announcement>>('/announcements', { params: { page } }).then(r => r.data),

  create: (formData: FormData) =>
    api.post<Announcement>('/announcements', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  update: (id: string, content: string) =>
    api.put(`/announcements/${id}`, { content }).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/announcements/${id}`).then(r => r.data),

  getComments: (id: string) =>
    api.get<Comment[]>(`/announcements/${id}/comments`).then(r => r.data),

  addComment: (id: string, content: string) =>
    api.post<Comment>(`/announcements/${id}/comments`, { content }).then(r => r.data),

  deleteComment: (announcementId: string, commentId: string) =>
    api.delete(`/announcements/${announcementId}/comments/${commentId}`).then(r => r.data),

  toggleReaction: (id: string, type: ReactionType) =>
    api.post(`/announcements/${id}/reactions`, { type }).then(r => r.data),
};

// ── Messages ──────────────────────────────────────────────────────
export const messageService = {
  getConversations: () =>
    api.get<Conversation[]>('/messages').then(r => r.data),

  getMessages: (partnerId: string, page = 1) =>
    api.get<Message[]>(`/messages/${partnerId}`, { params: { page } }).then(r => r.data),

  send: (receiverId: string, content: string) =>
    api.post<Message>('/messages', { receiverId, content }).then(r => r.data),

  getUnreadCount: () =>
    api.get<{ count: number }>('/messages/unread/count').then(r => r.data),
};
