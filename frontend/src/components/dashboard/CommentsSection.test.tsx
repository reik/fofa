import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentsSection } from './CommentsSection';
import { Comment } from '../../types';

vi.mock('../../services', () => ({
  announcementService: {
    getComments: vi.fn(),
    addComment: vi.fn(),
    deleteComment: vi.fn(),
  },
}));

vi.mock('../../contexts/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', name: 'Sarah Mitchell', thumbnail: null },
  }),
}));

import { announcementService } from '../../services';

const stubComment: Comment = {
  id: 'c-1',
  announcement_id: 'ann-1',
  user_id: 'user-2',
  author_name: 'James',
  author_thumbnail: null,
  content: 'Great post!',
  created_at: new Date().toISOString(),
};

describe('CommentsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading text initially', () => {
    vi.mocked(announcementService.getComments).mockReturnValue(new Promise(() => {}));
    render(<CommentsSection announcementId="ann-1" onCommentAdded={vi.fn()} />);
    expect(screen.getByText(/loading comments/i)).toBeInTheDocument();
  });

  it('shows empty state when no comments', async () => {
    vi.mocked(announcementService.getComments).mockResolvedValue([]);
    render(<CommentsSection announcementId="ann-1" onCommentAdded={vi.fn()} />);
    expect(await screen.findByText(/no comments yet/i)).toBeInTheDocument();
  });

  it('renders comments after load', async () => {
    vi.mocked(announcementService.getComments).mockResolvedValue([stubComment]);
    render(<CommentsSection announcementId="ann-1" onCommentAdded={vi.fn()} />);
    expect(await screen.findByText('Great post!')).toBeInTheDocument();
    expect(screen.getByText('James')).toBeInTheDocument();
  });

  it('renders comment textarea for logged-in user', async () => {
    vi.mocked(announcementService.getComments).mockResolvedValue([]);
    render(<CommentsSection announcementId="ann-1" onCommentAdded={vi.fn()} />);
    await screen.findByText(/no comments yet/i);
    expect(screen.getByLabelText(/write a comment/i)).toBeInTheDocument();
  });

  it('submits a new comment', async () => {
    vi.mocked(announcementService.getComments).mockResolvedValue([]);
    vi.mocked(announcementService.addComment).mockResolvedValue({
      ...stubComment, content: 'Nice!', user_id: 'user-1',
    });
    const onCommentAdded = vi.fn();
    render(<CommentsSection announcementId="ann-1" onCommentAdded={onCommentAdded} />);
    await screen.findByText(/no comments yet/i);
    await userEvent.type(screen.getByLabelText(/write a comment/i), 'Nice!');
    await userEvent.click(screen.getByRole('button', { name: /post/i }));
    await waitFor(() => expect(announcementService.addComment).toHaveBeenCalledWith('ann-1', 'Nice!'));
    expect(onCommentAdded).toHaveBeenCalledOnce();
  });

  it('shows delete button only for own comments', async () => {
    const ownComment: Comment = { ...stubComment, user_id: 'user-1' };
    vi.mocked(announcementService.getComments).mockResolvedValue([ownComment]);
    render(<CommentsSection announcementId="ann-1" onCommentAdded={vi.fn()} />);
    expect(await screen.findByRole('button', { name: /delete comment/i })).toBeInTheDocument();
  });

  it('calls deleteComment when delete is clicked', async () => {
    const ownComment: Comment = { ...stubComment, user_id: 'user-1' };
    vi.mocked(announcementService.getComments).mockResolvedValue([ownComment]);
    vi.mocked(announcementService.deleteComment).mockResolvedValue({});
    render(<CommentsSection announcementId="ann-1" onCommentAdded={vi.fn()} />);
    await screen.findByRole('button', { name: /delete comment/i });
    await userEvent.click(screen.getByRole('button', { name: /delete comment/i }));
    await waitFor(() => expect(announcementService.deleteComment).toHaveBeenCalledWith('ann-1', 'c-1'));
  });
});
