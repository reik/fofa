import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LoginPage } from './LoginPage';

vi.mock('../services', () => ({
  authService: { login: vi.fn() },
}));

vi.mock('../contexts/authStore', () => ({
  useAuthStore: () => ({
    setAuth: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { authService } from '../services';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password fields', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders Sign In button', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('calls authService.login with credentials on submit', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: 'tok',
      user: { id: 'u1', name: 'Sarah', email: 'sarah@example.com', city: 'Austin', state: 'TX', thumbnail: null, verified: true, created_at: '' },
    });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(authService.login).toHaveBeenCalledWith('sarah@example.com', 'Password1!'));
  });

  it('navigates to dashboard after successful login', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      token: 'tok',
      user: { id: 'u1', name: 'Sarah', email: 'sarah@example.com', city: 'Austin', state: 'TX', thumbnail: null, verified: true, created_at: '' },
    });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'Password1!');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
  });

  it('shows error toast on login failure', async () => {
    vi.mocked(authService.login).mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    await userEvent.type(screen.getByLabelText(/email address/i), 'sarah@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Invalid credentials'));
  });

  it('renders link to register page', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('renders forgot password link', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });
});
