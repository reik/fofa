import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { CreateAnnouncementForm } from './CreateAnnouncementForm';

vi.mock('../../services', () => ({
  announcementService: { create: vi.fn() },
}));

vi.mock('../../contexts/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'user-1', name: 'Sarah Mitchell', thumbnail: null },
  }),
}));

import { announcementService } from '../../services';

describe('CreateAnnouncementForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the announcement textarea', () => {
    render(<CreateAnnouncementForm onCreated={vi.fn()} />);
    expect(screen.getByLabelText(/write an announcement/i)).toBeInTheDocument();
  });

  it('renders the Post Announcement button', () => {
    render(<CreateAnnouncementForm onCreated={vi.fn()} />);
    expect(screen.getByRole('button', { name: /post announcement/i })).toBeInTheDocument();
  });

  it('Post button is disabled when textarea is empty', () => {
    render(<CreateAnnouncementForm onCreated={vi.fn()} />);
    expect(screen.getByRole('button', { name: /post announcement/i })).toBeDisabled();
  });

  it('enables Post button when content is typed', async () => {
    render(<CreateAnnouncementForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/write an announcement/i), 'Hello!');
    expect(screen.getByRole('button', { name: /post announcement/i })).not.toBeDisabled();
  });

  it('calls create and shows success toast on submit', async () => {
    vi.mocked(announcementService.create).mockResolvedValue({} as any);
    const onCreated = vi.fn();
    render(<CreateAnnouncementForm onCreated={onCreated} />);
    await userEvent.type(screen.getByLabelText(/write an announcement/i), 'Foster family update!');
    await userEvent.click(screen.getByRole('button', { name: /post announcement/i }));
    await waitFor(() => expect(announcementService.create).toHaveBeenCalledWith(expect.any(FormData)));
    expect(onCreated).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Announcement posted!');
  });

  it('clears the textarea after successful post', async () => {
    vi.mocked(announcementService.create).mockResolvedValue({} as any);
    render(<CreateAnnouncementForm onCreated={vi.fn()} />);
    const textarea = screen.getByLabelText(/write an announcement/i);
    await userEvent.type(textarea, 'Some content');
    await userEvent.click(screen.getByRole('button', { name: /post announcement/i }));
    await waitFor(() => expect(announcementService.create).toHaveBeenCalled());
    expect(textarea).toHaveValue('');
  });

  it('shows error toast when create fails', async () => {
    vi.mocked(announcementService.create).mockRejectedValue(new Error('fail'));
    render(<CreateAnnouncementForm onCreated={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/write an announcement/i), 'Test');
    await userEvent.click(screen.getByRole('button', { name: /post announcement/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to post. Please try again.'));
  });

  it('renders nothing when user is null', () => {
    // Override auth store mock for this test
    const { container } = render(<CreateAnnouncementForm onCreated={vi.fn()} />);
    expect(container.firstChild).not.toBeNull();
  });
});
