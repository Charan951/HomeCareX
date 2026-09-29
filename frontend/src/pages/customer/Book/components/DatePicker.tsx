import { FOCUS_RING } from "@/components/customer/focusRing";

interface DatePickerProps {
  value: string | null;
  onChange: (date: string) => void;
  /** Furthest date bookable, YYYY-MM-DD. Defaults to 30 days out. */
  maxDate?: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Plain native date input, floored at today (bookings can't be made for the past). */
export default function DatePicker({ value, onChange, maxDate }: DatePickerProps) {
  const min = todayISO();
  return (
    <div>
      <label htmlFor="booking-date" className="mb-1.5 block text-sm font-medium text-ink">
        Choose a date
      </label>
      <input
        id="booking-date"
        type="date"
        min={min}
        max={maxDate}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-[44px] w-full rounded border border-line bg-panel px-3 text-sm text-ink ${FOCUS_RING}`}
      />
    </div>
  );
}
