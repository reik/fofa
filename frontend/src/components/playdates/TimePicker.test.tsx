import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  it('renders hour select, minute select, AM and PM buttons', () => {
    render(<TimePicker label="Start time" value="10:00" onChange={vi.fn()} />);
    expect(screen.getByLabelText('Start time hour')).toBeInTheDocument();
    expect(screen.getByLabelText('Start time minute')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'AM' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'PM' })).toBeInTheDocument();
  });

  it('parses a morning time and shows AM pressed', () => {
    render(<TimePicker label="Start time" value="09:30" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'PM' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('parses an afternoon time and shows PM pressed', () => {
    render(<TimePicker label="Start time" value="14:00" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'PM' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('calls onChange with 24h PM value when PM is clicked', async () => {
    const onChange = vi.fn();
    render(<TimePicker label="Start time" value="10:00" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'PM' }));
    // 10 AM → 10 PM = 22:00
    expect(onChange).toHaveBeenCalledWith('22:00');
  });

  it('calls onChange with 24h AM value when AM is clicked', async () => {
    const onChange = vi.fn();
    render(<TimePicker label="Start time" value="14:00" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'AM' }));
    // 2 PM → 2 AM = 02:00
    expect(onChange).toHaveBeenCalledWith('02:00');
  });

  it('calls onChange when hour select changes', async () => {
    const onChange = vi.fn();
    render(<TimePicker label="Start time" value="10:00" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Start time hour'), '3');
    expect(onChange).toHaveBeenCalledWith('03:00');
  });

  it('calls onChange when minute select changes', async () => {
    const onChange = vi.fn();
    render(<TimePicker label="Start time" value="10:00" onChange={onChange} />);
    await userEvent.selectOptions(screen.getByLabelText('Start time minute'), '30');
    expect(onChange).toHaveBeenCalledWith('10:30');
  });

  it('renders label text', () => {
    render(<TimePicker label="End time" value="11:00" onChange={vi.fn()} />);
    expect(screen.getByText('End time')).toBeInTheDocument();
  });

  it('handles noon (12:00 PM) correctly', () => {
    render(<TimePicker label="Start time" value="12:00" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'PM' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles midnight (00:00) as 12 AM', () => {
    render(<TimePicker label="Start time" value="00:00" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'AM' })).toHaveAttribute('aria-pressed', 'true');
  });
});
