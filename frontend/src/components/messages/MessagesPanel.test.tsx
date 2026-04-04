import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MessagesPanel } from './MessagesPanel';

vi.mock('../../services', () => ({
  messageService: {
    getConversations: vi.fn(),
    getMessages: vi.fn(),
    send: vi.fn(),
    getUnreadCount: vi.fn(),
  },
  userService: { search: vi.fn() },
}));

vi.mock('../../contexts/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', name: 'Sarah Mitchell', thumbnail: null },
  }),
}));

vi.mock('../../hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}));

import { messageService, userService } from '../../services';

function renderPanel(route = '/messages') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <MessagesPanel />
    </MemoryRouter>
  );
}

describe('MessagesPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(messageService.getConversations).mockResolvedValue([]);
    vi.mocked(messageService.getMessages).mockResolvedValue([]);
  });

  it('renders the Messages heading', async () => {
    renderPanel();
    expect(await screen.findByText('Messages')).toBeInTheDocument();
  });

  it('renders search input for members', async () => {
    renderPanel();
    await screen.findByText('Messages');
    expect(screen.getByRole('combobox', { name: /search members/i })).toBeInTheDocument();
  });

  it('shows empty conversations state', async () => {
    renderPanel();
    expect(await screen.findByText(/no conversations yet/i)).toBeInTheDocument();
  });

  it('renders conversations when available', async () => {
    vi.mocked(messageService.getConversations).mockResolvedValue([
      {
        id: 'conv-1',
        partner_id: 'user-2',
        partner_name: 'James Okafor',
        partner_thumbnail: null,
        content: 'Hey!',
        created_at: new Date().toISOString(),
        unread_count: 0,
      },
    ]);
    renderPanel();
    expect(await screen.findByText('James Okafor')).toBeInTheDocument();
  });

  it('shows search results when typing in search', async () => {
    vi.mocked(userService.search).mockResolvedValue([
      { id: 'user-3', name: 'Maria Santos', thumbnail: null, city: 'Miami', state: 'FL', email: '', verified: true, created_at: '' },
    ]);
    renderPanel();
    await screen.findByText('Messages');
    await userEvent.type(screen.getByRole('combobox'), 'Maria');
    await waitFor(() => expect(userService.search).toHaveBeenCalledWith('Maria'));
    expect(await screen.findByText('Maria Santos')).toBeInTheDocument();
  });

  it('shows select conversation prompt in chat area when no conversation selected', async () => {
    renderPanel();
    await screen.findByText('Messages');
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it('loads messages when a conversation is clicked', async () => {
    vi.mocked(messageService.getConversations).mockResolvedValue([
      {
        id: 'conv-1',
        partner_id: 'user-2',
        partner_name: 'James Okafor',
        partner_thumbnail: null,
        content: 'Hey!',
        created_at: new Date().toISOString(),
        unread_count: 0,
      },
    ]);
    vi.mocked(messageService.getMessages).mockResolvedValue([
      {
        id: 'm-1',
        sender_id: 'user-2',
        receiver_id: 'user-1',
        sender_name: 'James Okafor',
        sender_thumbnail: null,
        content: 'Hello there',
        created_at: new Date().toISOString(),
        read: true,
      },
    ]);
    renderPanel();
    await userEvent.click(await screen.findByText('James Okafor'));
    expect(await screen.findByText('Hello there')).toBeInTheDocument();
  });

  it('sends a message when form is submitted', async () => {
    vi.mocked(messageService.getConversations).mockResolvedValue([
      {
        id: 'conv-1',
        partner_id: 'user-2',
        partner_name: 'James Okafor',
        partner_thumbnail: null,
        content: '',
        created_at: new Date().toISOString(),
        unread_count: 0,
      },
    ]);
    vi.mocked(messageService.send).mockResolvedValue({
      id: 'm-2', sender_id: 'user-1', receiver_id: 'user-2',
      sender_name: 'Sarah', sender_thumbnail: null,
      content: 'Hi James!', created_at: new Date().toISOString(), read: false,
    });
    renderPanel();
    await userEvent.click(await screen.findByText('James Okafor'));
    const input = await screen.findByLabelText(/message james okafor/i);
    await userEvent.type(input, 'Hi James!');
    await userEvent.click(screen.getByRole('button', { name: /send/i }));
    await waitFor(() => expect(messageService.send).toHaveBeenCalledWith('user-2', 'Hi James!'));
  });
});
