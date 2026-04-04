import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AnnouncementCard } from './AnnouncementCard';
import { Announcement } from '../../types';

vi.mock('../../services', () => ({
  announcementService: {
    toggleReaction: vi.fn(),
    remove: vi.fn(),
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

vi.mock('../dashboard/CommentsSection', () => ({
  CommentsSection: () => <div data-testid="comments-section" />,
}));

import { announcementService } from '../../services';

const baseAnnouncement: Announcement = {
  id: 'ann-1',
  userId: 'user-2',
  content: 'Hello foster families!',
  mediaUrl: null,
  mediaType: null,
  createdAt: new Date().toISOString(),
  author: { name: 'James Okafor', thumbnail: null },
  reactions: {},
  userReaction: null,
  commentCount: 0,
};

function renderCard(props: Partial<Announcement> = {}) {
  return render(
    <MemoryRouter>
      <AnnouncementCard
        announcement={{ ...baseAnnouncement, ...props }}
        onUpdate={vi.fn()}
      />
    </MemoryRouter>
  );
}

describe('AnnouncementCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the announcement content', () => {
    renderCard();
    expect(screen.getByText('Hello foster families!')).toBeInTheDocument();
  });

  it('renders the author name', () => {
    renderCard();
    expect(screen.getByText('James Okafor')).toBeInTheDocument();
  });

  it('does not show delete button for non-owner', () => {
    renderCard();
    expect(screen.queryByLabelText('Delete announcement')).not.toBeInTheDocument();
  });

  it('shows delete button for the owner', () => {
    renderCard({ userId: 'user-1' });
    expect(screen.getByLabelText('Delete announcement')).toBeInTheDocument();
  });

  it('calls remove and onUpdate after confirmed delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(announcementService.remove).mockResolvedValue({});
    const onUpdate = vi.fn();
    render(
      <MemoryRouter>
        <AnnouncementCard
          announcement={{ ...baseAnnouncement, userId: 'user-1' }}
          onUpdate={onUpdate}
        />
      </MemoryRouter>
    );
    await userEvent.click(screen.getByLabelText('Delete announcement'));
    await waitFor(() => expect(announcementService.remove).toHaveBeenCalledWith('ann-1'));
    expect(onUpdate).toHaveBeenCalledOnce();
  });

  it('shows reaction picker when React button is clicked', async () => {
    renderCard();
    await userEvent.click(screen.getByLabelText('Add reaction'));
    expect(screen.getByRole('toolbar', { name: 'Reaction picker' })).toBeInTheDocument();
  });

  it('calls toggleReaction when a reaction is selected', async () => {
    vi.mocked(announcementService.toggleReaction).mockResolvedValue({ action: 'added', type: 'like' });
    renderCard();
    await userEvent.click(screen.getByLabelText('Add reaction'));
    await userEvent.click(screen.getByLabelText('Like'));
    await waitFor(() => expect(announcementService.toggleReaction).toHaveBeenCalledWith('ann-1', 'like'));
  });

  it('shows comment count when commentCount > 0', () => {
    renderCard({ commentCount: 3 });
    expect(screen.getByText(/3 Comments/i)).toBeInTheDocument();
  });

  it('shows CommentsSection when Comment button is clicked', async () => {
    renderCard();
    await userEvent.click(screen.getByRole('button', { name: /comment/i }));
    expect(screen.getByTestId('comments-section')).toBeInTheDocument();
  });

  it('renders reaction summary when reactions exist', () => {
    renderCard({ reactions: { like: 2, love: 1 } });
    // Chips render as "👍 2" and "❤️ 1" — use custom matcher to find by substring
    expect(screen.getByText((content) => content.includes('👍') && content.includes('2'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('❤️') && content.includes('1'))).toBeInTheDocument();
  });
});
