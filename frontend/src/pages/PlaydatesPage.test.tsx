import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlaydatesPage } from './PlaydatesPage';
import { PlaydateRequest, AvailabilitySlot } from '../types';

vi.mock('../services', () => ({
  playdateService: {
    getAvailability: vi.fn(),
    getRequests: vi.fn(),
    addSlot: vi.fn(),
    updateSlot: vi.fn(),
    deleteSlot: vi.fn(),
    createRequest: vi.fn(),
    respond: vi.fn(),
  },
}));

vi.mock('../contexts/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'me', name: 'Me', email: 'me@example.com' } }),
}));

vi.mock('../components/playdates/WeekCalendar', async () => {
  const actual = await vi.importActual<typeof import('../components/playdates/WeekCalendar')>(
    '../components/playdates/WeekCalendar'
  );
  return {
    ...actual,
    WeekCalendar: ({ slots }: { slots: AvailabilitySlot[] }) => (
      <div data-testid="week-calendar">week-calendar({slots.length})</div>
    ),
  };
});

vi.mock('../components/playdates/MonthCalendar', () => ({
  MonthCalendar: ({ slots }: { slots: AvailabilitySlot[] }) => (
    <div data-testid="month-calendar">month-calendar({slots.length})</div>
  ),
}));

vi.mock('../components/playdates/TimePicker', () => ({
  TimePicker: ({ label }: { label: string }) => <label>{label}</label>,
}));

vi.mock('../components/ui/Modal', () => ({
  Modal: ({ open, title, children }: { open: boolean; title: string; children: React.ReactNode }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { playdateService } from '../services';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <PlaydatesPage />
    </QueryClientProvider>
  );
}

function makeRequest(overrides: Partial<PlaydateRequest> = {}): PlaydateRequest {
  return {
    id: 'r1',
    requester_id: 'other',
    owner_id: 'me',
    slot_id: 's1',
    message: null,
    status: 'pending',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-01T10:00:00Z',
    requester_name: 'Alice',
    requester_thumbnail: null,
    owner_name: 'Me',
    owner_thumbnail: null,
    slot_date: '2026-06-10',
    slot_start_time: '10:00',
    slot_end_time: '12:00',
    ...overrides,
  } as PlaydateRequest;
}

describe('PlaydatesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(playdateService.getAvailability).mockResolvedValue([]);
    vi.mocked(playdateService.getRequests).mockResolvedValue([]);
  });

  it('renders the Playdates heading and Add Slot button', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /^playdates$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /\+ add slot/i })).toBeInTheDocument();
  });

  it('shows the empty state when there are no requests', async () => {
    renderPage();
    expect(
      await screen.findByText(/no playdate requests yet/i)
    ).toBeInTheDocument();
  });

  it('renders the week calendar by default and switches to month view', async () => {
    renderPage();
    expect(await screen.findByTestId('week-calendar')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^month$/i }));
    expect(await screen.findByTestId('month-calendar')).toBeInTheDocument();
    expect(screen.queryByTestId('week-calendar')).not.toBeInTheDocument();
  });

  it("shows incoming pending requests under 'Needs your response'", async () => {
    vi.mocked(playdateService.getRequests).mockResolvedValue([
      makeRequest({ requester_name: 'Alice', status: 'pending' }),
    ]);
    renderPage();

    expect(await screen.findByText(/needs your response/i)).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  it("shows outgoing pending requests outside 'Needs your response'", async () => {
    vi.mocked(playdateService.getRequests).mockResolvedValue([
      makeRequest({
        id: 'r2',
        requester_id: 'me',
        owner_id: 'other',
        owner_name: 'Bob',
        status: 'pending',
      }),
    ]);
    renderPage();

    expect(await screen.findByText('Bob')).toBeInTheDocument();
    expect(screen.queryByText(/needs your response/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^accept$/i })).not.toBeInTheDocument();
  });

  it('shows the pending count badge in the requests heading', async () => {
    vi.mocked(playdateService.getRequests).mockResolvedValue([
      makeRequest({ id: 'r1' }),
      makeRequest({ id: 'r2', requester_name: 'Carol' }),
    ]);
    renderPage();

    expect(await screen.findByText(/2 pending/i)).toBeInTheDocument();
  });

  it('opens the Add Slot modal when + Add Slot is clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /\+ add slot/i }));
    expect(
      await screen.findByRole('dialog', { name: /add availability slot/i })
    ).toBeInTheDocument();
  });

  it('calls playdateService.respond when Accept is clicked', async () => {
    vi.mocked(playdateService.getRequests).mockResolvedValue([
      makeRequest({ id: 'r1' }),
    ]);
    vi.mocked(playdateService.respond).mockResolvedValue(
      makeRequest({ status: 'accepted' })
    );

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /accept/i }));

    await waitFor(() =>
      expect(playdateService.respond).toHaveBeenCalledWith('r1', 'accepted')
    );
  });

  it('calls playdateService.respond with declined when Decline is clicked', async () => {
    vi.mocked(playdateService.getRequests).mockResolvedValue([
      makeRequest({ id: 'r1' }),
    ]);
    vi.mocked(playdateService.respond).mockResolvedValue(
      makeRequest({ status: 'declined' })
    );

    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /decline/i }));

    await waitFor(() =>
      expect(playdateService.respond).toHaveBeenCalledWith('r1', 'declined')
    );
  });

  it('fetches availability for the current user', async () => {
    renderPage();
    await waitFor(() =>
      expect(playdateService.getAvailability).toHaveBeenCalledWith('me')
    );
  });

  it('hides Accept/Decline for already-resolved requests', async () => {
    vi.mocked(playdateService.getRequests).mockResolvedValue([
      makeRequest({ id: 'r1', status: 'accepted' }),
    ]);
    renderPage();

    await screen.findByText('Alice');
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /decline/i })).not.toBeInTheDocument();
  });
});
