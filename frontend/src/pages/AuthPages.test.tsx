import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import toast from 'react-hot-toast';
import { VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from './AuthPages';

vi.mock('../services', () => ({
  authService: {
    verifyEmail: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { authService } from '../services';

// ── VerifyEmailPage ─────────────────────────────────────────────────

describe('VerifyEmailPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows verifying state initially', () => {
    vi.mocked(authService.verifyEmail).mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={['/?token=abc123']}>
        <Routes>
          <Route path="/" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText(/verifying your email/i)).toBeInTheDocument();
  });

  it('shows success state after successful verification', async () => {
    vi.mocked(authService.verifyEmail).mockResolvedValue({});
    render(
      <MemoryRouter initialEntries={['/?token=abc123']}>
        <Routes>
          <Route path="/" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to sign in/i })).toBeInTheDocument();
  });

  it('shows error state when no token in URL', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/verification failed/i)).toBeInTheDocument();
  });

  it('shows error state when verification fails', async () => {
    vi.mocked(authService.verifyEmail).mockRejectedValue(new Error('expired'));
    render(
      <MemoryRouter initialEntries={['/?token=bad']}>
        <Routes>
          <Route path="/" element={<VerifyEmailPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByText(/verification failed/i)).toBeInTheDocument();
  });
});

// ── ForgotPasswordPage ──────────────────────────────────────────────

describe('ForgotPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders email input and Send Reset Link button', () => {
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
  });

  it('calls forgotPassword with the entered email', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({});
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(authService.forgotPassword).toHaveBeenCalledWith('sarah@example.com'));
  });

  it('shows success state after email is sent', async () => {
    vi.mocked(authService.forgotPassword).mockResolvedValue({});
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    expect(await screen.findByText(/we've sent a reset link/i)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows error toast when forgotPassword fails', async () => {
    vi.mocked(authService.forgotPassword).mockRejectedValue(new Error('fail'));
    render(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});

// ── ResetPasswordPage ───────────────────────────────────────────────

describe('ResetPasswordPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders new password and confirm fields', () => {
    render(
      <MemoryRouter initialEntries={['/?token=reset123']}>
        <Routes>
          <Route path="/" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(document.getElementById('new-password')).toBeInTheDocument();
    expect(document.getElementById('confirm-new-password')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(
      <MemoryRouter initialEntries={['/?token=reset123']}>
        <Routes>
          <Route path="/" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );
    await userEvent.type(document.getElementById('new-password')!, 'NewPass1!');
    await userEvent.type(document.getElementById('confirm-new-password')!, 'Different!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
  });

  it('calls resetPassword and navigates to login on success', async () => {
    vi.mocked(authService.resetPassword).mockResolvedValue({});
    render(
      <MemoryRouter initialEntries={['/?token=reset123']}>
        <Routes>
          <Route path="/" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );
    await userEvent.type(document.getElementById('new-password')!, 'NewPass1!');
    await userEvent.type(document.getElementById('confirm-new-password')!, 'NewPass1!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(authService.resetPassword).toHaveBeenCalledWith('reset123', 'NewPass1!'));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(toast.success).toHaveBeenCalled();
  });

  it('shows error toast when resetPassword fails', async () => {
    vi.mocked(authService.resetPassword).mockRejectedValue(new Error('expired'));
    render(
      <MemoryRouter initialEntries={['/?token=reset123']}>
        <Routes>
          <Route path="/" element={<ResetPasswordPage />} />
        </Routes>
      </MemoryRouter>
    );
    await userEvent.type(document.getElementById('new-password')!, 'NewPass1!');
    await userEvent.type(document.getElementById('confirm-new-password')!, 'NewPass1!');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
  });
});
