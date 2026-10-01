import { Clock, AlertCircle } from "lucide-react";
import type { SlotAvailability, SlotsResponse } from "@/types/booking";

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
  /** Active selected slot passed as 'value' by StepSlot */
  value?: string | null;
  selectedSlot?: string | null;
  /** Selection callback passed as 'onChange' by StepSlot */
  onChange?: (slot: string) => void;
  onSelectSlot?: (slot: string) => void;
  onSelect?: (slot: string) => void;
}

export function SlotPicker({
  slots,
  value,
  selectedSlot,
  onChange,
  onSelectSlot,
  onSelect,
}: SlotPickerProps) {
  // Normalize slots: handles raw array, SlotsResponse object, or undefined
  const slotList: SlotAvailability[] = Array.isArray(slots)
    ? slots
    : Array.isArray((slots as SlotsResponse)?.slots)
    ? (slots as SlotsResponse).slots
    : [];

  // Match either value or selectedSlot
  const currentSelected = value ?? selectedSlot ?? null;

  const handleSelect = (slotKey: string) => {
    onChange?.(slotKey);
    onSelectSlot?.(slotKey);
    onSelect?.(slotKey);
  };

  const allTaken = slotList.length > 0 && slotList.every((s) => !s.available);

  if (slotList.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-panel p-6 text-center text-sm text-muted">
        No time slots available for this date. Please choose another date.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allTaken && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>All slots are fully booked or have already passed for today. Please pick another date.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {slotList.map((slotItem) => {
          const isSelected = currentSelected === slotItem.slot;
          const isAvailable = Boolean(slotItem.available);

          return (
            <button
              key={slotItem.slot}
              type="button"
              disabled={!isAvailable}
              onClick={() => handleSelect(slotItem.slot)}
              className={`flex items-center justify-between p-3.5 rounded-lg border text-sm font-medium transition text-left ${
                !isAvailable
                  ? "border-line bg-gray-50 text-muted/50 cursor-not-allowed opacity-60"
                  : isSelected
                  ? "border-brand bg-brand/5 text-brand ring-2 ring-brand font-semibold shadow-sm"
                  : "border-line bg-panel text-ink hover:border-brand/40 hover:bg-gray-50/50 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock
                  className={`h-4 w-4 ${
                    isSelected ? "text-brand" : "text-muted"
                  }`}
                />
                <span>{formatSlotLabel(slotItem.slot)}</span>
              </div>

              <span className="text-xs">
                {!isAvailable ? (
                  <span className="text-red-500 font-normal">Unavailable</span>
                ) : slotItem.remaining !== undefined && slotItem.remaining <= 2 ? (
                  <span className="text-amber-600 font-normal">
                    {slotItem.remaining} left
                  </span>
                ) : (
                  <span className="text-emerald-600 font-normal">Available</span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SlotPicker;