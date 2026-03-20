import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input, Textarea } from '../../components/ui/Input';

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Email is required" />);
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('calls onChange on user input', async () => {
    const handler = vi.fn();
    render(<Input label="Name" onChange={handler} />);
    await userEvent.type(screen.getByLabelText('Name'), 'Jane');
    expect(handler).toHaveBeenCalled();
  });

  it('renders placeholder', () => {
    render(<Input placeholder="Enter your email" />);
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
  });
});

describe('Textarea', () => {
  it('renders with label', () => {
    render(<Textarea label="Message" />);
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('shows error message', () => {
    render(<Textarea label="Bio" error="Too long" />);
    expect(screen.getByText('Too long')).toBeInTheDocument();
  });
});
