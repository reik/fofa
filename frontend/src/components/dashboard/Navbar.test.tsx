import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Navbar } from './Navbar';

vi.mock('../../services', () => ({
  messageService: { getUnreadCount: vi.fn() },
  playdateService: { getRequests: vi.fn() },
}));

vi.mock('../../contexts/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      name: 'Sarah Mitchell',
      thumbnail: null,
      city: 'Austin',
      state: 'TX',
    },
    logout: vi.fn(),
  }),
}));

import { messageService, playdateService } from '../../services';

function renderNavbar(initialRoute = '/dashboard') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Navbar />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(messageService.getUnreadCount).mockResolvedValue({ count: 0 });
    vi.mocked(playdateService.getRequests).mockResolvedValue([]);
  });

  it('renders the main navigation', () => {
    renderNavbar();
    expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('renders all nav links', () => {
    renderNavbar();
    expect(screen.getAllByRole('link', { name: /feed/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /family/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /playdates/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /messages/i })[0]).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /community/i })[0]).toBeInTheDocument();
  });

  it('renders user name in desktop nav', () => {
    renderNavbar();
    expect(screen.getByText('Sarah Mitchell')).toBeInTheDocument();
  });

  it('opens profile menu when avatar is clicked', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: /open profile menu/i }));
    expect(screen.getByRole('menu', { name: /profile menu/i })).toBeInTheDocument();
  });

  it('shows profile menu items', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: /open profile menu/i }));
    expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
  });

  it('closes menu on Escape key', async () => {
    renderNavbar();
    await userEvent.click(screen.getByRole('button', { name: /open profile menu/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows unread badge on Messages when count > 0', async () => {
    vi.mocked(messageService.getUnreadCount).mockResolvedValue({ count: 3 });
    renderNavbar();
    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: /messages, 3 pending/i });
      expect(links.length).toBeGreaterThan(0);
    });
  });

  it('shows pending badge on Playdates when pending requests exist', async () => {
    vi.mocked(playdateService.getRequests).mockResolvedValue([
      { id: 'r-1', requester_id: 'user-2', owner_id: 'user-1', slot_id: 's-1', status: 'pending', message: '', created_at: '' },
    ]);
    renderNavbar();
    await waitFor(() => {
      const links = screen.getAllByRole('link', { name: /playdates, 1 pending/i });
      expect(links.length).toBeGreaterThan(0);
    });
  });
});
