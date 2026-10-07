import { AlertCircle, Check, Moon, Sun, Sunrise, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import type { SlotAvailability, SlotsResponse } from "@/types/booking";
import { FOCUS_RING } from "@/components/customer/focusRing";

export function formatSlotLabel(slot: string): string {
  if (!slot) return "";
  const parts = slot.split("-");
  if (parts.length !== 2) return slot;

  const formatTime = (timeStr: string) => {
    const [hStr, mStr] = timeStr.trim().split(":");
    const h = parseInt(hStr, 10);
    const m = mStr ? mStr.padStart(2, "0") : "00";
    if (isNaN(h)) return timeStr;
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${m} ${period}`;
  };

  return `${formatTime(parts[0])} – ${formatTime(parts[1])}`;
}

export interface SlotPickerProps {
  slots?: SlotAvailability[] | SlotsResponse | null;
  value?: string | null;
  selectedSlot?: string | null;
  onChange?: (slot: string) => void;
  onSelectSlot?: (slot: string) => void;
  onSelect?: (slot: string) => void;
}

const PERIODS: { id: string; label: string; hint: string; Icon: LucideIcon; match: (hour: number) => boolean }[] = [
  { id: "morning", label: "Morning", hint: "Before 12 PM", Icon: Sunrise, match: (h) => h < 12 },
  { id: "afternoon", label: "Afternoon", hint: "12 PM – 4 PM", Icon: Sun, match: (h) => h >= 12 && h < 16 },
  { id: "evening", label: "Evening", hint: "After 4 PM", Icon: Moon, match: (h) => h >= 16 },
];

const startHour = (slot: string): number => {
  const h = parseInt(slot.split("-")[0] ?? "", 10);
  return Number.isNaN(h) ? 0 : h;
};

export function SlotPicker({ slots, value, selectedSlot, onChange, onSelectSlot, onSelect }: SlotPickerProps) {
  const slotList: SlotAvailability[] = Array.isArray(slots)
    ? slots
    : Array.isArray((slots as SlotsResponse)?.slots)
    ? (slots as SlotsResponse).slots
    : [];

  const currentSelected = value ?? selectedSlot ?? null;

  const handleSelect = (slotKey: string) => {
    onChange?.(slotKey);
    onSelectSlot?.(slotKey);
    onSelect?.(slotKey);
  };

  const allTaken = slotList.length > 0 && slotList.every((s) => !s.available);

  if (slotList.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-canvas p-6 text-center text-sm text-muted">
        No time slots available for this date. Please choose another date.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {allTaken && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <span>All slots are fully booked or have already passed for today. Please pick another date.</span>
        </div>
      )}

      {PERIODS.map(({ id, label, hint, Icon, match }) => {
        const group = slotList.filter((s) => match(startHour(s.slot)));
        if (group.length === 0) return null;
        const open = group.filter((s) => s.available).length;
        return (
          <div key={id} role="group" aria-label={`${label} slots`}>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-ink">{label}</span>
                <span className="text-xs text-muted">{hint}</span>
              </div>
              <span className="text-xs font-medium text-muted">{open > 0 ? `${open} open` : "Full"}</span>
            </div>
            <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 xl:grid-cols-3">
              {group.map((slotItem) => {
                const isSelected = currentSelected === slotItem.slot;
                const isAvailable = Boolean(slotItem.available);
                const fewLeft = isAvailable && slotItem.remaining !== undefined && slotItem.remaining <= 2;
                return (
                  <button
                    key={slotItem.slot}
                    type="button"
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(slotItem.slot)}
                    className={clsx(
                      "relative flex min-h-[60px] items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all duration-200 motion-reduce:transition-none",
                      FOCUS_RING,
                      !isAvailable && "cursor-not-allowed border-line bg-canvas text-muted/60",
                      isAvailable && isSelected && "border-brand bg-brand-soft shadow-[0_12px_24px_-16px_rgba(67,56,202,.9)] ring-1 ring-brand",
                      isAvailable && !isSelected && "cursor-pointer border-line bg-panel text-ink hover:border-brand/50 motion-safe:hover:-translate-y-px",
                    )}
                  >
                    <span className="min-w-0">
                      <span className={clsx("block truncate text-sm font-semibold", !isAvailable && "line-through decoration-muted/40", isSelected && "text-brand")}>
                        {formatSlotLabel(slotItem.slot)}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium">
                        {!isAvailable ? (
                          <span className="text-danger/80">Fully booked</span>
                        ) : fewLeft ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
                            <span className="text-amber-600">Only {slotItem.remaining} left</span>
                          </>
                        ) : (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                            <span className="text-emerald-600">Available</span>
                          </>
                        )}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={clsx(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isSelected ? "border-brand bg-brand text-white" : "border-line text-transparent",
                        !isAvailable && "opacity-40",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SlotPicker;
