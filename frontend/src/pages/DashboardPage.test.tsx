import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('../components/dashboard/AnnouncementFeed', () => ({
  AnnouncementFeed: () => <div data-testid="feed" />,
}));

vi.mock('../components/announcements/CreateAnnouncementForm', () => ({
  CreateAnnouncementForm: ({ onCreated }: { onCreated: () => void }) => (
    <button onClick={onCreated} data-testid="create-form">Post</button>
  ),
}));

import { announcementService, familyService, userService } from '../services';


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
    vi.mocked(announcementService.getAll).mockResolvedValue({ data: [], pagination: { page: 1, limit: 10, pages: 1, total: 0 } });
    vi.mocked(familyService.getAll).mockResolvedValue([]);
    vi.mocked(userService.search).mockResolvedValue([]);
  });

  it('renders the create announcement form', async () => {
    renderPage();
    expect(await screen.findByTestId('create-form')).toBeInTheDocument();
  });

  it('renders the feed region', async () => {
    renderPage();
    expect(await screen.findByTestId('feed')).toBeInTheDocument();
  });

  it('shows user name in sidebar', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument());
  });
});
