import React from "react";
import { AvailabilitySlot } from "../../types";
import { isoDate, weekMonday } from "./WeekCalendar";

interface MonthCalendarProps {
  /** Any date inside the month to display */
  monthDate: Date;
  slots: AvailabilitySlot[];
  mode: "own" | "view";
  /** IDs of slots that overlap with the viewer's own free slots */
  matchingSlotIds?: Set<string>;
  onCellClick?: (date: string) => void;
  onSlotClick?: (slot: AvailabilitySlot) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function fmtTime(t: string): string {
  const parts = t.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const ampm = h < 12 ? "am" : "pm";
  const display = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${display}${ampm}` : `${display}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Build the 5–6 week grid for a month, starting on Monday */
function buildMonthGrid(monthDate: Date): Date[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  // Start from the Monday on or before the 1st
  const gridStart = weekMonday(firstOfMonth);

  const days: Date[] = [];
  const cursor = new Date(gridStart);
  // Build until we've covered the full month (at least 4 weeks, stop after the month ends and row is complete)
  while (true) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getMonth() !== month && cursor.getDay() === 1) break; // past month end, landed on Monday
    if (days.length > 42) break; // safety
  }
  return days;
}

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  monthDate,
  slots,
  mode,
  matchingSlotIds,
  onCellClick,
  onSlotClick,
}) => {
  const today = isoDate(new Date());
  const currentMonth = monthDate.getMonth();

  const days = buildMonthGrid(monthDate);

  // Group slots by date
  const slotsByDate: Record<string, AvailabilitySlot[]> = {};
  slots.forEach((s) => {
    (slotsByDate[s.date] ??= []).push(s);
  });

  return (
    <div className="rounded-lg border-[1.5px] border-border bg-surface shadow-sm overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b-[1.5px] border-border">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center py-2 text-[0.75rem] font-bold text-muted uppercase tracking-wide border-r border-border/60 last:border-r-0"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const iso = isoDate(day);
          const isToday = iso === today;
          const isCurrentMonth = day.getMonth() === currentMonth;
          const daySlots = slotsByDate[iso] ?? [];
          const isLastRow = idx >= days.length - 7;

          return (
            <div
              key={iso}
              className={[
                "min-h-[90px] p-1 border-r border-b border-border/60 last-of-type:border-r-0 flex flex-col gap-[3px] transition-colors",
                !isLastRow ? "" : "border-b-0",
                (idx + 1) % 7 === 0 ? "border-r-0" : "",
                isCurrentMonth ? "bg-surface" : "bg-bg",
                mode === "own" && isCurrentMonth ? "cursor-pointer hover:bg-brand-light/20" : "",
              ].join(" ")}
              onClick={() => {
                if (mode === "own" && isCurrentMonth) onCellClick?.(iso);
              }}
              {...(mode === "own" && isCurrentMonth
                ? {
                    role: "button" as const,
                    tabIndex: 0,
                    "aria-label": `Add availability slot on ${iso}`,
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onCellClick?.(iso);
                      }
                    },
                  }
                : {})}
            >
              {/* Date number */}
              <div className="flex justify-end">
                <span
                  className={[
                    "text-[0.8rem] font-bold w-6 h-6 flex items-center justify-center rounded-full leading-none",
                    isToday
                      ? "bg-brand text-white"
                      : isCurrentMonth
                      ? "text-[color:var(--color-text)]"
                      : "text-muted",
                  ].join(" ")}
                >
                  {day.getDate()}
                </span>
              </div>

              {/* Slot chips */}
              <div className="flex flex-col gap-[2px]">
                {daySlots.map((slot) => {
                  const isFree = slot.status === "free";
                  const isMatch = matchingSlotIds?.has(slot.id) ?? false;
                  const isClickable = mode === "own" || (mode === "view" && isFree);
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isClickable) onSlotClick?.(slot);
                      }}
                      title={
                        slot.note
                          ? `${fmtTime(slot.start_time)}–${fmtTime(slot.end_time)}: ${slot.note}`
                          : `${fmtTime(slot.start_time)}–${fmtTime(slot.end_time)}`
                      }
                      className={[
                        "w-full text-left text-[0.68rem] font-semibold px-[5px] py-[2px] rounded leading-tight truncate border-none",
                        isMatch
                          ? "bg-accent text-[color:var(--color-text)] ring-1 ring-yellow-400"
                          : isFree
                          ? "bg-brand/85 text-white"
                          : "bg-border text-muted",
                        isClickable ? "cursor-pointer hover:opacity-75" : "cursor-default",
                      ].join(" ")}
                    >
                      {isMatch && <span aria-label="Matching slot">★ </span>}
                      {fmtTime(slot.start_time)}
                      {slot.note ? ` · ${slot.note}` : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
