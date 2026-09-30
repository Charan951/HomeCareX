import { useMemo, useRef, type KeyboardEvent } from "react";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { getBookableDates } from "@/features/booking";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
}

/**
 * Next-14-days picker. A radio group with a roving tab stop: Tab enters/leaves the group once,
 * arrow keys move focus between dates, Space/Enter selects. Wraps to a grid, so the page never
 * scrolls sideways at 360px.
 */
export default function DatePicker({ value, onChange }: DatePickerProps) {
  const dates = useMemo(() => getBookableDates(), []);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const selectedIndex = dates.findIndex((d) => d.iso === value);
  const tabStopIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (step === 0) return;
    e.preventDefault();
    const next = (index + step + dates.length) % dates.length;
    refs.current[next]?.focus();
  };

  return (
    <div>
      <span id="booking-date-label" className="mb-1.5 block text-sm font-medium text-ink">
        Choose a date
      </span>
      <div
        role="radiogroup"
        aria-labelledby="booking-date-label"
        className="grid grid-cols-4 gap-2 sm:grid-cols-7"
      >
        {dates.map((d, i) => {
          const selected = d.iso === value;
          return (
            <button
              key={d.iso}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${d.weekday} ${d.day} ${d.month}${d.isToday ? ", today" : ""}`}
              tabIndex={i === tabStopIndex ? 0 : -1}
              onClick={() => onChange(d.iso)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex min-h-[56px] flex-col items-center justify-center rounded border px-1 py-2 text-center transition-colors ${FOCUS_RING} ${
                selected ? "border-brand bg-brand text-white" : "border-line bg-panel text-ink hover:border-brand"
              }`}
            >
              <span className={`text-xs ${selected ? "text-white/90" : "text-muted"}`}>{d.isToday ? "Today" : d.weekday}</span>
              <span className="text-base font-semibold leading-tight">{d.day}</span>
              <span className={`text-xs ${selected ? "text-white/90" : "text-muted"}`}>{d.month}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
