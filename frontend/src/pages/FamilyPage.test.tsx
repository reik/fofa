import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FamilyPage } from './FamilyPage';

vi.mock('../services', () => ({
  familyService: { getAll: vi.fn() },
}));

vi.mock('../components/family/FamilyMemberCard', () => ({
  FamilyMemberCard: ({ member }: { member: { name: string } }) => <div data-testid="family-card">{member.name}</div>,
  FamilyMemberForm: ({ onCancel }: { onCancel: () => void }) => (
    <div data-testid="family-form">
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

import { familyService } from '../services';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <FamilyPage />
    </QueryClientProvider>
  );
}

describe('FamilyPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the My Family heading', async () => {
    vi.mocked(familyService.getAll).mockResolvedValue([]);
    renderPage();
    expect(screen.getByRole('heading', { name: /my family/i })).toBeInTheDocument();
  });

  it('shows empty state when no members', async () => {
    vi.mocked(familyService.getAll).mockResolvedValue([]);
    renderPage();
    expect(await screen.findByText(/no family members yet/i)).toBeInTheDocument();
  });

  it('renders family member cards when members exist', async () => {
    vi.mocked(familyService.getAll).mockResolvedValue([
      { id: 'fm-1', user_id: 'user-1', name: 'Emma', age: 7, thumbnail: null, created_at: '' },
      { id: 'fm-2', user_id: 'user-1', name: 'Liam', age: 5, thumbnail: null, created_at: '' },
    ]);
    renderPage();
    expect(await screen.findByText('Emma')).toBeInTheDocument();
    expect(screen.getByText('Liam')).toBeInTheDocument();
  });

  it('opens add member modal when Add Member is clicked', async () => {
    vi.mocked(familyService.getAll).mockResolvedValue([]);
    renderPage();
    await screen.findByText(/no family members yet/i);
    await userEvent.click(screen.getByRole('button', { name: /add first member/i }));
    expect(await screen.findByTestId('family-form')).toBeInTheDocument();
  });

  it('renders Add Member button in header', async () => {
    vi.mocked(familyService.getAll).mockResolvedValue([]);
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: /\+ add member/i })).toBeInTheDocument());
  });
});
