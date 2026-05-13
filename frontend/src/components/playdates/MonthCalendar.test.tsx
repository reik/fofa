import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MonthCalendar } from './MonthCalendar';
import { AvailabilitySlot } from '../../types';

const JUNE_2025 = new Date(2025, 5, 15); // June 15 2025, local time

function makeSlot(overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot {
  return {
    id: 'slot-1',
    user_id: 'user-1',
    date: '2025-06-16',
    start_time: '09:00',
    end_time: '10:00',
    status: 'free',
    note: null,
    created_at: '2025-06-01 00:00:00',
    ...overrides,
  };
}

describe('MonthCalendar', () => {
  it('renders all day-of-week headers', () => {
    render(<MonthCalendar monthDate={JUNE_2025} slots={[]} mode="own" />);
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('renders a free slot chip with formatted time', () => {
    render(<MonthCalendar monthDate={JUNE_2025} slots={[makeSlot()]} mode="own" />);
    expect(screen.getByRole('button', { name: /9am/i })).toBeInTheDocument();
  });

  it('calls onSlotClick when a free slot chip is clicked', async () => {
    const onSlotClick = vi.fn();
    const slot = makeSlot();
    render(
      <MonthCalendar monthDate={JUNE_2025} slots={[slot]} mode="own" onSlotClick={onSlotClick} />
    );
    await userEvent.click(screen.getByRole('button', { name: /9am/i }));
    expect(onSlotClick).toHaveBeenCalledWith(slot);
  });

  it('calls onCellClick with the date when a day cell is clicked in own mode', async () => {
    const onCellClick = vi.fn();
    render(
      <MonthCalendar monthDate={JUNE_2025} slots={[]} mode="own" onCellClick={onCellClick} />
    );
    // Click on the 16th cell
    const cells = screen.getAllByText('16');
    await userEvent.click(cells[0]!);
    expect(onCellClick).toHaveBeenCalledWith('2025-06-16');
  });

  it('does not call onCellClick in view mode', async () => {
    const onCellClick = vi.fn();
    render(
      <MonthCalendar monthDate={JUNE_2025} slots={[]} mode="view" onCellClick={onCellClick} />
    );
    const cells = screen.getAllByText('16');
    await userEvent.click(cells[0]!);
    expect(onCellClick).not.toHaveBeenCalled();
  });

  it('shows ★ and gold style for matching slots', () => {
    render(
      <MonthCalendar
        monthDate={JUNE_2025}
        slots={[makeSlot()]}
        mode="view"
        matchingSlotIds={new Set(['slot-1'])}
      />
    );
    expect(screen.getByText(/★/)).toBeInTheDocument();
  });

  it('does not show ★ for non-matching slots', () => {
    render(
      <MonthCalendar
        monthDate={JUNE_2025}
        slots={[makeSlot()]}
        mode="view"
        matchingSlotIds={new Set()}
      />
    );
    expect(screen.queryByText(/★/)).not.toBeInTheDocument();
  });

  it('shows slot note in chip when provided', () => {
    render(
      <MonthCalendar monthDate={JUNE_2025} slots={[makeSlot({ note: 'Park visit' })]} mode="own" />
    );
    expect(screen.getByRole('button', { name: /Park visit/i })).toBeInTheDocument();
  });

  it('renders a busy slot chip with gray style', () => {
    render(
      <MonthCalendar monthDate={JUNE_2025} slots={[makeSlot({ status: 'busy' })]} mode="own" />
    );
    const chip = screen.getByRole('button', { name: /9am/i });
    expect(chip.className).toMatch(/bg-gray/);
  });

  it('busy slots are not clickable in view mode', async () => {
    const onSlotClick = vi.fn();
    render(
      <MonthCalendar
        monthDate={JUNE_2025}
        slots={[makeSlot({ status: 'busy' })]}
        mode="view"
        onSlotClick={onSlotClick}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /9am/i }));
    expect(onSlotClick).not.toHaveBeenCalled();
  });
});
