import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import toast from 'react-hot-toast';
import { FamilyMemberCard, FamilyMemberForm } from './FamilyMemberCard';
import { FamilyMember } from '../../types';

vi.mock('../../services', () => ({
  familyService: {
    remove: vi.fn(),
    add: vi.fn(),
    update: vi.fn(),
  },
}));

import { familyService } from '../../services';

const member: FamilyMember = {
  id: 'fm-1',
  user_id: 'user-1',
  name: 'Emma',
  age: 7,
  thumbnail: null,
  created_at: new Date().toISOString(),
};

describe('FamilyMemberCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the member name and age', () => {
    render(<FamilyMemberCard member={member} onUpdate={vi.fn()} />);
    expect(screen.getByText('Emma')).toBeInTheDocument();
    expect(screen.getByText(/Age 7/)).toBeInTheDocument();
  });

  it('renders Edit and Remove buttons', () => {
    render(<FamilyMemberCard member={member} onUpdate={vi.fn()} />);
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  it('opens edit modal when Edit is clicked', async () => {
    render(<FamilyMemberCard member={member} onUpdate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(screen.getByText(/Edit Emma/i)).toBeInTheDocument();
  });

  it('calls remove and onUpdate after confirmed delete', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(familyService.remove).mockResolvedValue({});
    const onUpdate = vi.fn();
    render(<FamilyMemberCard member={member} onUpdate={onUpdate} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => expect(familyService.remove).toHaveBeenCalledWith('fm-1'));
    expect(onUpdate).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Emma removed');
  });

  it('does not call remove when confirm is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<FamilyMemberCard member={member} onUpdate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(familyService.remove).not.toHaveBeenCalled();
  });

  it('shows error toast when remove fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(familyService.remove).mockRejectedValue(new Error('fail'));
    render(<FamilyMemberCard member={member} onUpdate={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to remove member'));
  });
});

describe('FamilyMemberForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders name and age inputs', () => {
    render(<FamilyMemberForm onSaved={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
  });

  it('shows Add Member button when no existing member', () => {
    render(<FamilyMemberForm onSaved={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
  });

  it('shows Save Changes button when editing existing member', () => {
    render(<FamilyMemberForm existing={member} onSaved={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('pre-fills name and age when editing', () => {
    render(<FamilyMemberForm existing={member} onSaved={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByLabelText(/name/i)).toHaveValue('Emma');
    expect(screen.getByLabelText(/age/i)).toHaveValue(7);
  });

  it('calls familyService.update on submit when editing', async () => {
    vi.mocked(familyService.update).mockResolvedValue(member);
    const onSaved = vi.fn();
    render(<FamilyMemberForm existing={member} onSaved={onSaved} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(familyService.update).toHaveBeenCalledWith('fm-1', expect.any(FormData)));
    expect(onSaved).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalledWith('Member updated!');
  });

  it('calls familyService.add on submit when adding new', async () => {
    vi.mocked(familyService.add).mockResolvedValue(member);
    const onSaved = vi.fn();
    render(<FamilyMemberForm onSaved={onSaved} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/name/i), 'Liam');
    await userEvent.type(screen.getByLabelText(/age/i), '5');
    await userEvent.click(screen.getByRole('button', { name: /add member/i }));
    await waitFor(() => expect(familyService.add).toHaveBeenCalledWith(expect.any(FormData)));
    expect(onSaved).toHaveBeenCalledOnce();
  });

  it('calls onCancel when Cancel is clicked', async () => {
    const onCancel = vi.fn();
    render(<FamilyMemberForm onSaved={vi.fn()} onCancel={onCancel} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
