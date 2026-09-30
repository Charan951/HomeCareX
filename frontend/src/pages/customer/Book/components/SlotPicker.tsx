import { FOCUS_RING } from "@/components/customer/focusRing";
import type { SlotAvailability } from "@/types/booking";

interface SlotPickerProps {
  slots: SlotAvailability[];
  value: string | null;
  onChange: (slot: string) => void;
}

/** Grid of time-slot buttons; unavailable slots are visibly and functionally disabled. */
export default function SlotPicker({ slots, value, onChange }: SlotPickerProps) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink">Choose a time slot</span>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Time slot">
        {slots.map(({ slot, available }) => {
          const selected = value === slot;
          return (
            <button
              key={slot}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!available}
              onClick={() => onChange(slot)}
              className={`min-h-[44px] rounded border px-3 text-sm font-medium transition-colors ${FOCUS_RING} ${
                !available
                  ? "cursor-not-allowed border-line bg-canvas text-muted/60 line-through"
                  : selected
                    ? "border-brand bg-brand text-white"
                    : "border-line bg-panel text-ink hover:border-brand"
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
