import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { ProfileForm } from './ProfileForm';

vi.mock('../../contexts/authStore', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      name: 'Sarah Mitchell',
      email: 'sarah@example.com',
      city: 'Austin',
      state: 'TX',
      thumbnail: null,
    },
    updateUser: vi.fn(),
  }),
}));

vi.mock('../../services', () => ({
  userService: { updateProfile: vi.fn() },
}));

// Import after mocks are set up
import { userService } from '../../services';

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with user data pre-filled', () => {
    render(<ProfileForm />);
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Sarah Mitchell');
    expect(screen.getByLabelText(/city/i)).toHaveValue('Austin');
    // State select has no htmlFor — query by its displayed value
    const stateSelect = screen.getByDisplayValue('TX');
    expect(stateSelect).toBeInTheDocument();
  });

  it('shows the user email as read-only info', () => {
    render(<ProfileForm />);
    expect(screen.getByText(/sarah@example\.com/)).toBeInTheDocument();
  });

  it('shows validation error when name is cleared and submitted', async () => {
    render(<ProfileForm />);
    await userEvent.clear(screen.getByLabelText(/full name/i));
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('calls updateProfile and shows success toast on valid submit', async () => {
    vi.mocked(userService.updateProfile).mockResolvedValue({
      id: 'user-1', name: 'Sarah M.', city: 'Austin', state: 'TX',
      thumbnail: null, email: 'sarah@example.com', verified: true, created_at: '',
    });
    render(<ProfileForm />);
    await userEvent.clear(screen.getByLabelText(/full name/i));
    await userEvent.type(screen.getByLabelText(/full name/i), 'Sarah M.');
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(userService.updateProfile).toHaveBeenCalledOnce());
    expect(toast.success).toHaveBeenCalledWith('Profile updated!');
  });

  it('shows error toast when API call fails', async () => {
    vi.mocked(userService.updateProfile).mockRejectedValue(new Error('Network error'));
    render(<ProfileForm />);
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to update profile'));
  });

  it('renders the Save Changes button', () => {
    render(<ProfileForm />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('renders Change profile photo label', () => {
    render(<ProfileForm />);
    expect(screen.getByText(/change profile photo/i)).toBeInTheDocument();
  });
});
