import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../../components/ui/Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={vi.fn()}><p>Content</p></Modal>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders content when open', () => {
    render(<Modal open={true} onClose={vi.fn()}><p>Modal Content</p></Modal>);
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Modal open={true} onClose={vi.fn()} title="Edit Profile"><p>Body</p></Modal>);
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose} title="Test"><p>Body</p></Modal>);
    await userEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop clicked', async () => {
    const onClose = vi.fn();
    render(<Modal open={true} onClose={onClose}><p>Body</p></Modal>);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
