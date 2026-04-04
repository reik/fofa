import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CommunityPage } from './CommunityPage';

vi.mock('../services', () => ({
  userService: { search: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { userService } from '../services';

describe('CommunityPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the Community heading', async () => {
    vi.mocked(userService.search).mockResolvedValue([]);
    render(<MemoryRouter><CommunityPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: /community/i })).toBeInTheDocument();
  });

  it('renders the search input', async () => {
    vi.mocked(userService.search).mockResolvedValue([]);
    render(<MemoryRouter><CommunityPage /></MemoryRouter>);
    expect(screen.getByLabelText(/search members/i)).toBeInTheDocument();
  });

  it('shows no members found when search returns empty', async () => {
    vi.mocked(userService.search).mockResolvedValue([]);
    render(<MemoryRouter><CommunityPage /></MemoryRouter>);
    expect(await screen.findByText(/no members found/i)).toBeInTheDocument();
  });

  it('renders member cards when results exist', async () => {
    vi.mocked(userService.search).mockResolvedValue([
      { id: 'u-2', name: 'James Okafor', city: 'Chicago', state: 'IL', thumbnail: null, email: '', verified: true, created_at: '' },
    ]);
    render(<MemoryRouter><CommunityPage /></MemoryRouter>);
    expect(await screen.findByText('James Okafor')).toBeInTheDocument();
    expect(screen.getByText(/chicago, il/i)).toBeInTheDocument();
  });

  it('navigates to messages when Message button is clicked', async () => {
    vi.mocked(userService.search).mockResolvedValue([
      { id: 'u-2', name: 'James Okafor', city: 'Chicago', state: 'IL', thumbnail: null, email: '', verified: true, created_at: '' },
    ]);
    render(<MemoryRouter><CommunityPage /></MemoryRouter>);
    await userEvent.click(await screen.findByRole('button', { name: /message/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/messages?partner=u-2');
  });

  it('searches when query changes', async () => {
    vi.mocked(userService.search).mockResolvedValue([]);
    render(<MemoryRouter><CommunityPage /></MemoryRouter>);
    await screen.findByText(/no members found/i);
    await userEvent.type(screen.getByLabelText(/search members/i), 'James');
    await waitFor(() => expect(userService.search).toHaveBeenCalledWith('James'));
  });
});
