import React from "react";
import { AvailabilitySlot } from "../../types";

interface WeekCalendarProps {
  /** ISO date string for any day in the week to display */
  weekStart: Date;
  slots: AvailabilitySlot[];
  /** Own calendar: can click empty cells to add, click slots to edit/delete */
  mode: "own" | "view";
  /** IDs of slots that overlap with the viewer's own free slots */
  matchingSlotIds?: Set<string>;
  onCellClick?: (date: string) => void;
  onSlotClick?: (slot: AvailabilitySlot) => void;
}

const GRID_START_HOUR = 7;
const HOURS = Array.from({ length: 14 }, (_, i) => i + GRID_START_HOUR); // 7am–8pm

function toMinutes(t: string): number {
  const parts = t.split(":").map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function fmtHour(h: number): string {
  const ampm = h < 12 ? "am" : "pm";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${ampm}`;
}

function fmtTime(t: string): string {
  const parts = t.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const ampm = h < 12 ? "am" : "pm";
  const display = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${display}${ampm}` : `${display}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Return the Monday of the week containing `d` */
export function weekMonday(d: Date): Date {
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const dow = day.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  day.setDate(day.getDate() + diff);
  return day;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const SLOT_HEIGHT = 56; // px per hour
const LABEL_COL = 44;   // px for time labels

export const WeekCalendar: React.FC<WeekCalendarProps> = ({
  weekStart,
  slots,
  mode,
  matchingSlotIds,
  onCellClick,
  onSlotClick,
}) => {
  const monday = weekMonday(weekStart);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = isoDate(new Date());

  // Group slots by date
  const slotsByDate: Record<string, AvailabilitySlot[]> = {};
  slots.forEach((s) => {
    (slotsByDate[s.date] ??= []).push(s);
  });

  const gridStart = GRID_START_HOUR * 60; // earliest minute shown

  return (
    <div className="overflow-x-auto rounded-lg border-[1.5px] border-border bg-surface shadow-sm">
      {/* Header row */}
      <div
        className="grid border-b-[1.5px] border-border"
        style={{
          gridTemplateColumns: `${LABEL_COL}px repeat(7, minmax(80px, 1fr))`,
        }}
      >
        <div className="border-r-[1.5px] border-border" />
        {days.map((d, i) => {
          const iso = isoDate(d);
          const isToday = iso === today;
          return (
            <div
              key={iso}
              className={[
                "text-center py-2 text-[0.78rem] font-bold border-r-[1.5px] border-border last:border-r-0",
                isToday ? "text-brand bg-brand-light" : "text-muted",
              ].join(" ")}
            >
              <div>{dayLabels[i]}</div>
              <div
                className={[
                  "text-[1rem] font-bold mt-[1px]",
                  isToday ? "text-brand-dark" : "text-[color:var(--color-text)]",
                ].join(" ")}
              >
                {d.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: `${LABEL_COL}px repeat(7, minmax(80px, 1fr))`,
          height: `${HOURS.length * SLOT_HEIGHT}px`,
          position: "relative",
        }}
      >
        {/* Time labels column */}
        <div className="border-r-[1.5px] border-border relative">
          {HOURS.map((h) => (
            <div
              key={h}
              className="absolute w-full text-right pr-2 text-[0.68rem] text-muted leading-none"
              style={{ top: (h - GRID_START_HOUR) * SLOT_HEIGHT - 7 }}
            >
              {fmtHour(h)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d) => {
          const iso = isoDate(d);
          const daySlots = slotsByDate[iso] ?? [];

          return (
            <div
              key={iso}
              className="relative border-r-[1.5px] border-border last:border-r-0"
              style={{ height: `${HOURS.length * SLOT_HEIGHT}px` }}
            >
              {/* Hour grid lines */}
              {HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute w-full border-t border-border/40"
                  style={{ top: (h - GRID_START_HOUR) * SLOT_HEIGHT }}
                />
              ))}

              {/* Clickable background for own mode */}
              {mode === "own" && (
                <button
                  type="button"
                  aria-label={`Add availability slot on ${iso}`}
                  className="absolute inset-0 cursor-pointer hover:bg-brand-light/30 transition-colors border-none bg-transparent w-full"
                  onClick={() => onCellClick?.(iso)}
                />
              )}

              {/* Slot blocks */}
              {daySlots.map((slot) => {
                const startMin = toMinutes(slot.start_time);
                const endMin = toMinutes(slot.end_time);
                const topPx =
                  ((startMin - gridStart) / 60) * SLOT_HEIGHT;
                const heightPx =
                  ((endMin - startMin) / 60) * SLOT_HEIGHT;

                const isFree = slot.status === "free";
                const isMatch = matchingSlotIds?.has(slot.id) ?? false;
                const baseColor = isMatch
                  ? "bg-accent border-yellow-500 text-[color:var(--color-text)]"
                  : isFree
                  ? "bg-brand/90 border-brand-dark text-white"
                  : "bg-border border-muted text-muted";

                return (
                  <button
                    key={slot.id}
                    type="button"
                    className={[
                      "absolute left-[2px] right-[2px] rounded border-l-[3px] px-[5px] py-[3px] text-[0.7rem] leading-tight overflow-hidden z-10 transition-opacity text-left border-none",
                      baseColor,
                      isMatch ? "ring-2 ring-yellow-400 ring-offset-1" : "",
                      mode === "own" || (mode === "view" && isFree)
                        ? "cursor-pointer hover:opacity-80"
                        : "cursor-default",
                    ].join(" ")}
                    style={{ top: topPx, height: Math.max(heightPx, 18) }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotClick?.(slot);
                    }}
                    aria-label={
                      slot.note
                        ? `${fmtTime(slot.start_time)}–${fmtTime(slot.end_time)}: ${slot.note}`
                        : `${fmtTime(slot.start_time)}–${fmtTime(slot.end_time)}`
                    }
                  >
                    <div className="font-bold truncate flex items-center gap-1">
                      {isMatch && <span aria-label="Matching slot">★</span>}
                      {fmtTime(slot.start_time)}
                    </div>
                    {heightPx >= 36 && slot.note && (
                      <div className="truncate opacity-80">{slot.note}</div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
