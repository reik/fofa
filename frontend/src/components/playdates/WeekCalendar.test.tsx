import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { WeekCalendar, weekMonday, isoDate } from './WeekCalendar';
import { AvailabilitySlot } from '../../types';

// Use local date constructor to avoid UTC-to-local shift
const MONDAY = new Date(2025, 5, 16); // June 16 2025 (Monday)

function makeSlot(overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot {
  return {
    id: 'slot-1',
    user_id: 'user-1',
    date: '2025-06-16',
    start_time: '10:00',
    end_time: '11:00',
    status: 'free',
    note: null,
    created_at: '2025-06-01 00:00:00',
    ...overrides,
  };
}

describe('WeekCalendar', () => {
  it('renders all 7 day labels', () => {
    render(<WeekCalendar weekStart={MONDAY} slots={[]} mode="own" />);
    ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach((label) => {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    });
  });

  it('renders a free slot with formatted time', () => {
    render(<WeekCalendar weekStart={MONDAY} slots={[makeSlot()]} mode="own" />);
    expect(screen.getByTitle(/10am.*11am/)).toBeInTheDocument();
  });

  it('calls onCellClick when a day column background is clicked in own mode', async () => {
    const onCellClick = vi.fn();
    render(
      <WeekCalendar weekStart={MONDAY} slots={[]} mode="own" onCellClick={onCellClick} />
    );
    // The first day column hover overlay (Monday = 2025-06-16)
    const [firstOverlay] = Array.from(
      document.querySelectorAll<HTMLElement>('[class*="hover:bg-brand-light/30"]')
    );
    await userEvent.click(firstOverlay);
    expect(onCellClick).toHaveBeenCalledWith('2025-06-16');
  });

  it('calls onSlotClick when a slot is clicked in own mode', async () => {
    const onSlotClick = vi.fn();
    const slot = makeSlot();
    render(
      <WeekCalendar weekStart={MONDAY} slots={[slot]} mode="own" onSlotClick={onSlotClick} />
    );
    await userEvent.click(screen.getByTitle(/10am.*11am/));
    expect(onSlotClick).toHaveBeenCalledWith(slot);
  });

  it('calls onSlotClick when a free slot is clicked in view mode', async () => {
    const onSlotClick = vi.fn();
    const slot = makeSlot();
    render(
      <WeekCalendar weekStart={MONDAY} slots={[slot]} mode="view" onSlotClick={onSlotClick} />
    );
    await userEvent.click(screen.getByTitle(/10am.*11am/));
    expect(onSlotClick).toHaveBeenCalledWith(slot);
  });

  it('does not render cell click overlays in view mode', () => {
    render(<WeekCalendar weekStart={MONDAY} slots={[]} mode="view" />);
    expect(document.querySelectorAll('[class*="hover:bg-brand-light/30"]').length).toBe(0);
  });

  it('shows ★ star for matching slots', () => {
    render(
      <WeekCalendar
        weekStart={MONDAY}
        slots={[makeSlot()]}
        mode="view"
        matchingSlotIds={new Set(['slot-1'])}
      />
    );
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  it('does not show ★ for non-matching slots', () => {
    render(
      <WeekCalendar
        weekStart={MONDAY}
        slots={[makeSlot()]}
        mode="view"
        matchingSlotIds={new Set()}
      />
    );
    expect(screen.queryByText('★')).not.toBeInTheDocument();
  });

  it('shows note in slot tooltip', () => {
    render(
      <WeekCalendar weekStart={MONDAY} slots={[makeSlot({ note: 'Park visit' })]} mode="own" />
    );
    expect(screen.getByTitle(/Park visit/)).toBeInTheDocument();
  });
});

describe('weekMonday', () => {
  it('returns the same date when given a Monday', () => {
    const monday = new Date(2025, 5, 16); // June 16
    expect(isoDate(weekMonday(monday))).toBe('2025-06-16');
  });

  it('returns the preceding Monday when given a Wednesday', () => {
    const wednesday = new Date(2025, 5, 18); // June 18
    expect(isoDate(weekMonday(wednesday))).toBe('2025-06-16');
  });

  it('returns the preceding Monday when given a Sunday', () => {
    const sunday = new Date(2025, 5, 22); // June 22
    expect(isoDate(weekMonday(sunday))).toBe('2025-06-16');
  });
});
