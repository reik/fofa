import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from './DashboardPage';

vi.mock('../services', () => ({
  announcementService: { getAll: vi.fn() },
  familyService: { getAll: vi.fn() },
  userService: { search: vi.fn() },
}));

vi.mock('../contexts/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', name: 'Sarah Mitchell', thumbnail: null, city: 'Austin', state: 'TX' },
  }),
}));

vi.mock('../components/announcements/AnnouncementCard', () => ({
  AnnouncementCard: ({ announcement }: { announcement: { content: string } }) => (
    <div data-testid="announcement-card">{announcement.content}</div>
  ),
}));

vi.mock('../components/announcements/CreateAnnouncementForm', () => ({
  CreateAnnouncementForm: ({ onCreated }: { onCreated: () => void }) => (
    <button onClick={onCreated} data-testid="create-form">Post</button>
  ),
}));

import { announcementService, familyService, userService } from '../services';

const stubAnnouncement = {
  id: 'ann-1',
  userId: 'user-2',
  content: 'Hello community!',
  mediaUrl: null,
  mediaType: null,
  createdAt: new Date().toISOString(),
  author: { name: 'James', thumbnail: null },
  reactions: {},
  userReaction: null,
  commentCount: 0,
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(announcementService.getAll).mockResolvedValue({ data: [], pagination: { pages: 1, total: 0 } });
    vi.mocked(familyService.getAll).mockResolvedValue([]);
    vi.mocked(userService.search).mockResolvedValue([]);
  });

  it('renders the create announcement form', async () => {
    renderPage();
    expect(await screen.findByTestId('create-form')).toBeInTheDocument();
  });

  it('renders announcement cards when data is loaded', async () => {
    vi.mocked(announcementService.getAll).mockResolvedValue({ data: [stubAnnouncement], pagination: { pages: 1, total: 1 } });
    renderPage();
    expect(await screen.findByText('Hello community!')).toBeInTheDocument();
  });

  it('shows empty feed message when no announcements', async () => {
    renderPage();
    expect(await screen.findByText(/the feed is quiet/i)).toBeInTheDocument();
  });

  it('shows user name in sidebar', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument());
  });

  it('renders pagination next button when multiple pages exist', async () => {
    vi.mocked(announcementService.getAll).mockResolvedValue({ data: [stubAnnouncement], pagination: { pages: 2, total: 20 } });
    renderPage();
    expect(await screen.findByRole('button', { name: /next/i })).toBeInTheDocument();
  });
});
