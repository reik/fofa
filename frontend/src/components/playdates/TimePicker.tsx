import React, { useEffect, useState } from "react";

interface TimePickerProps {
  label: string;
  value: string; // HH:MM (24h)
  onChange: (value: string) => void;
}

const MINUTES = ["00", "15", "30", "45"];

function to24(hour: number, minute: string, ampm: "AM" | "PM"): string {
  let h = hour % 12;
  if (ampm === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
}

function parse24(value: string): { hour: number; minute: string; ampm: "AM" | "PM" } {
  const parts = value.split(":").map(Number);
  const h = parts[0] ?? 0;
  const m = parts[1] ?? 0;
  const ampm: "AM" | "PM" = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  const minute = MINUTES.includes(String(m).padStart(2, "0"))
    ? String(m).padStart(2, "0")
    : "00";
  return { hour, minute, ampm };
}

export const TimePicker: React.FC<TimePickerProps> = ({ label, value, onChange }) => {
  const parsed = parse24(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);
  const [ampm, setAmpm] = useState<"AM" | "PM">(parsed.ampm);

  // Sync outward whenever any part changes
  useEffect(() => {
    onChange(to24(hour, minute, ampm));
  }, [hour, minute, ampm]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectClass =
    "appearance-none bg-transparent outline-none text-[0.92rem] font-semibold text-[color:var(--color-text)] cursor-pointer text-center";

  return (
    <div>
      <label className="block text-[0.85rem] font-semibold mb-1 text-muted">{label}</label>
      <div className="inline-flex items-center gap-0 rounded-lg border-[1.5px] border-border focus-within:border-brand transition-colors overflow-hidden bg-surface">
        {/* Hour */}
        <select
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className={`${selectClass} pl-3 pr-1 py-[9px]`}
          aria-label={`${label} hour`}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>

        <span className="text-[0.92rem] font-bold text-muted select-none">:</span>

        {/* Minute */}
        <select
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className={`${selectClass} pl-1 pr-3 py-[9px]`}
          aria-label={`${label} minute`}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        {/* Divider */}
        <div className="w-px self-stretch bg-border" />

        {/* AM / PM toggle */}
        <div className="flex">
          {(["AM", "PM"] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setAmpm(period)}
              className={[
                "px-3 py-[9px] text-[0.82rem] font-bold border-none cursor-pointer transition-colors",
                ampm === period
                  ? "bg-brand text-white"
                  : "bg-transparent text-muted hover:bg-brand-light",
              ].join(" ")}
              aria-pressed={ampm === period}
              aria-label={period}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
