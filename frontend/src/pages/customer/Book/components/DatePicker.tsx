import { useMemo, useRef, type KeyboardEvent } from "react";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { getBookableDates } from "@/features/booking";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
}

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
      <span id="booking-date-label" className="mb-1 block text-xs font-semibold text-ink">
        Choose a date
      </span>
      <div
        role="radiogroup"
        aria-labelledby="booking-date-label"
        className="grid grid-cols-7 gap-1"
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
              className={`flex h-11 flex-col items-center justify-center rounded border px-0.5 py-0.5 text-center leading-none transition-colors ${FOCUS_RING} ${
                selected ? "border-brand bg-brand text-white" : "border-line bg-panel text-ink hover:border-brand"
              }`}
            >
              <span className={`text-[10px] ${selected ? "text-white/90" : "text-muted"}`}>
                {d.isToday ? "Today" : d.weekday}
              </span>
              <span className="my-0.5 text-xs font-bold">{d.day}</span>
              <span className={`text-[9px] ${selected ? "text-white/90" : "text-muted"}`}>{d.month}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}