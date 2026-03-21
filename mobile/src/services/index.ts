import api from './api';
import {
  User, Announcement, Comment, FamilyMember,
  Message, Conversation, ReactionType, PaginatedResponse,
} from '../types';

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: User }>('/auth/login', { email, password }).then(r => r.data),
  register: (data: { email: string; password: string; name: string; city: string; state: string }) =>
    api.post('/auth/register', data).then(r => r.data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }).then(r => r.data),
};

export const userService = {
  getMe: () => api.get<User>('/users/me').then(r => r.data),
  updateMe: (form: FormData) =>
    api.put<User>('/users/me', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  search: (q: string) => api.get<User[]>('/users/search', { params: { q } }).then(r => r.data),
};

export const familyService = {
  getAll: () => api.get<FamilyMember[]>('/family').then(r => r.data),
  create: (form: FormData) =>
    api.post<FamilyMember>('/family', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update: (id: string, form: FormData) =>
    api.put<FamilyMember>(`/family/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  remove: (id: string) => api.delete(`/family/${id}`),
};

export const announcementService = {
  getAll: (page = 1) =>
    api.get<PaginatedResponse<Announcement>>('/announcements', { params: { page } }).then(r => r.data),
  create: (form: FormData) =>
    api.post<Announcement>('/announcements', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update: (id: string, content: string) =>
    api.put<Announcement>(`/announcements/${id}`, { content }).then(r => r.data),
  remove: (id: string) => api.delete(`/announcements/${id}`),
  getComments: (id: string) =>
    api.get<Comment[]>(`/announcements/${id}/comments`).then(r => r.data),
  addComment: (id: string, content: string) =>
    api.post<Comment>(`/announcements/${id}/comments`, { content }).then(r => r.data),
  deleteComment: (announcementId: string, commentId: string) =>
    api.delete(`/announcements/${announcementId}/comments/${commentId}`),
  react: (id: string, type: ReactionType) =>
    api.post(`/announcements/${id}/reactions`, { type }).then(r => r.data),
};

export const messageService = {
  getConversations: () => api.get<Conversation[]>('/messages').then(r => r.data),
  getMessages: (partnerId: string, page = 1) =>
    api.get<Message[]>(`/messages/${partnerId}`, { params: { page } }).then(r => r.data),
  send: (receiverId: string, content: string) =>
    api.post<Message>('/messages', { receiverId, content }).then(r => r.data),
};
