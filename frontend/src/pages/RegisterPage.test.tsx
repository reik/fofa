import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';
import { RegisterPage } from './RegisterPage';

vi.mock('../services', () => ({
  authService: { register: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { authService } from '../services';

async function fillForm(opts: { name?: string; email?: string; city?: string; password?: string; confirm?: string } = {}) {
  const {
    name = 'Jane Smith',
    email = 'jane@example.com',
    city = 'Dallas',
    password = 'SecurePass1!',
    confirm = 'SecurePass1!',
  } = opts;
  if (name) await userEvent.type(screen.getByLabelText(/full name/i), name);
  if (email) await userEvent.type(screen.getByLabelText(/email address/i), email);
  if (city) await userEvent.type(screen.getByLabelText(/city/i), city);
  await userEvent.selectOptions(screen.getByRole('combobox'), 'TX');
  if (password) await userEvent.type(screen.getByLabelText(/^password$/i), password);
  if (confirm) await userEvent.type(screen.getByLabelText(/confirm password/i), confirm);
}

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('renders Create Account button', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    await fillForm({ confirm: 'DifferentPass!' });
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    await fillForm({ password: 'short', confirm: 'short' });
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/minimum 8 characters/i)).toBeInTheDocument();
  });

  it('calls authService.register on valid submit', async () => {
    vi.mocked(authService.register).mockResolvedValue({});
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(authService.register).toHaveBeenCalledWith({
      name: 'Jane Smith',
      email: 'jane@example.com',
      city: 'Dallas',
      state: 'TX',
      password: 'SecurePass1!',
    }));
  });

  it('shows email confirmation screen after successful register', async () => {
    vi.mocked(authService.register).mockResolvedValue({});
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
  });

  it('shows error toast when registration fails', async () => {
    vi.mocked(authService.register).mockRejectedValue({ response: { data: { error: 'Email already in use' } } });
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    await fillForm();
    await userEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Email already in use'));
  });

  it('renders link to login page', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });
});
