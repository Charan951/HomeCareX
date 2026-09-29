import React from 'react';
import { CalendarDays } from 'lucide-react';

/** ISO dates (YYYY-MM-DD). Empty string = open-ended. */
export interface DateRange {
  from: string;
  to: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Quick presets row. Pass false to hide. */
  presets?: boolean;
  max?: string;
}

const iso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};

const PRESETS: { label: string; range: () => DateRange }[] = [
  { label: 'Today', range: () => ({ from: iso(new Date()), to: iso(new Date()) }) },
  { label: '7 days', range: () => ({ from: daysAgo(6), to: iso(new Date()) }) },
  { label: '30 days', range: () => ({ from: daysAgo(29), to: iso(new Date()) }) },
  {
    label: 'This month',
    range: () => {
      const now = new Date();
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: iso(now) };
    },
  },
];

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange, presets = true, max }) => {
  const invalid = Boolean(value.from && value.to && value.from > value.to);

  // Picking a start after the end (or vice versa) moves the other side, so the range is never invalid.
  const setFrom = (from: string) => onChange({ from, to: value.to && from > value.to ? from : value.to });
  const setTo = (to: string) => onChange({ from: value.from && to < value.from ? to : value.from, to });

  return (
    <div className="hcx-daterange">
      <div className="hcx-daterange__inputs" aria-invalid={invalid}>
        <CalendarDays size={16} aria-hidden />
        <input type="date" value={value.from} max={value.to || max} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <span aria-hidden>–</span>
        <input type="date" value={value.to} min={value.from || undefined} max={max} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>
      {presets && (
        <div className="hcx-daterange__presets">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" className="hcx-chip" onClick={() => onChange(p.range())}>
              {p.label}
            </button>
          ))}
          {(value.from || value.to) && (
            <button type="button" className="hcx-chip" onClick={() => onChange({ from: '', to: '' })}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
