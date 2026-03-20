export interface User {
  id: string;
  email: string;
  name: string;
  city: string;
  state: string;
  thumbnail: string | null;
  verified: boolean;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  age: number;
  thumbnail: string | null;
  created_at: string;
}

export interface Announcement {
  id: string;
  userId: string;
  content: string;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  createdAt: string;
  updatedAt: string;
  author: { name: string; thumbnail: string | null };
  commentCount: number;
  reactions: Record<string, number>;
  userReaction: ReactionType | null;
}

export type ReactionType = 'like' | 'love' | 'hug' | 'celebrate' | 'support';

export interface Comment {
  id: string;
  announcement_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string;
  author_thumbnail: string | null;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender_name: string;
  sender_thumbnail: string | null;
}

export interface Conversation {
  id: string;
  partner_id: string;
  partner_name: string;
  partner_thumbnail: string | null;
  content: string;
  created_at: string;
  unread_count: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
