import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { ChangePasswordForm } from './ChangePasswordForm';

vi.mock('../../services', () => ({
  authService: { changePassword: vi.fn() },
}));

import { authService } from '../../services';

async function fillForm(current: string, next: string, confirm: string) {
  // Use generated ids (label text lowercased + hyphens) to avoid ambiguity
  await userEvent.type(document.getElementById('current-password')!, current);
  await userEvent.type(document.getElementById('new-password')!, next);
  await userEvent.type(document.getElementById('confirm-new-password')!, confirm);
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all three password fields', () => {
    render(<ChangePasswordForm />);
    expect(document.getElementById('current-password')).toBeInTheDocument();
    expect(document.getElementById('new-password')).toBeInTheDocument();
    expect(document.getElementById('confirm-new-password')).toBeInTheDocument();
  });

  it('renders the Update Password button', () => {
    render(<ChangePasswordForm />);
    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
  });

  it('shows error when new passwords do not match', async () => {
    render(<ChangePasswordForm />);
    await fillForm('OldPass1!', 'NewPass1!', 'DifferentPass!');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('shows error when new password is too short', async () => {
    render(<ChangePasswordForm />);
    await fillForm('OldPass1!', 'short', 'short');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('calls changePassword and shows success toast on valid submit', async () => {
    vi.mocked(authService.changePassword).mockResolvedValue({});
    render(<ChangePasswordForm />);
    await fillForm('OldPass1!', 'NewPass1!', 'NewPass1!');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() => expect(authService.changePassword).toHaveBeenCalledWith('OldPass1!', 'NewPass1!'));
    expect(toast.success).toHaveBeenCalledWith('Password changed!');
  });

  it('clears the form fields after successful submit', async () => {
    vi.mocked(authService.changePassword).mockResolvedValue({});
    render(<ChangePasswordForm />);
    await fillForm('OldPass1!', 'NewPass1!', 'NewPass1!');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() => expect(authService.changePassword).toHaveBeenCalled());
    expect(document.getElementById('current-password')).toHaveValue('');
    expect(document.getElementById('new-password')).toHaveValue('');
    expect(document.getElementById('confirm-new-password')).toHaveValue('');
  });

  it('shows API error message when changePassword fails', async () => {
    const err = { response: { data: { error: 'Current password is incorrect' } } };
    vi.mocked(authService.changePassword).mockRejectedValue(err);
    render(<ChangePasswordForm />);
    await fillForm('WrongPass!', 'NewPass1!', 'NewPass1!');
    await userEvent.click(screen.getByRole('button', { name: /update password/i }));
    expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument();
  });
});
