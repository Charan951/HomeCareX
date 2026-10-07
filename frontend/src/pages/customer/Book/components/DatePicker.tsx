import { useMemo, useRef, type KeyboardEvent } from "react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { getBookableDates } from "@/features/booking";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
}

/** Two-week date strip: swipeable row on phones, a tidy 7 x 2 calendar grid from tablet up. */
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
    <div
      role="radiogroup"
      aria-label="Choose a date"
      className="-mx-1 grid auto-cols-[3.75rem] grid-flow-col gap-2 overflow-x-auto px-1 pb-2 pt-1 [scrollbar-width:none] snap-x md:mx-0 md:auto-cols-auto md:grid-flow-row md:grid-cols-7 md:max-w-xl md:gap-2 md:overflow-visible md:px-0 md:pb-0 [&::-webkit-scrollbar]:hidden"
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
            className={clsx(
              "group relative flex snap-start flex-col items-center justify-center rounded-xl border px-1.5 py-2 text-center leading-none transition-all duration-200 motion-reduce:transition-none",
              FOCUS_RING,
              selected
                ? "border-transparent bg-gradient-to-br from-brand to-[#6D5BE8] text-white shadow-[0_14px_28px_-12px_rgba(67,56,202,.75)] motion-safe:-translate-y-0.5"
                : "border-line bg-panel text-ink hover:border-brand/50 hover:bg-brand-soft/50 motion-safe:hover:-translate-y-0.5",
            )}
          >
            <span className={clsx("text-[10px] font-semibold uppercase tracking-wide", selected ? "text-white/80" : d.isToday ? "text-accent" : "text-muted")}>
              {d.isToday ? "Today" : d.weekday}
            </span>
            <span className="mt-1 text-lg font-bold tabular-nums">{d.day}</span>
            <span className={clsx("mt-0.5 text-[10px] font-medium", selected ? "text-white/80" : "text-muted")}>{d.month}</span>
          </button>
        );
      })}
    </div>
  );
}
