import { Clock, AlertCircle } from "lucide-react";
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

export function SlotPicker({
  slots,
  value,
  selectedSlot,
  onChange,
  onSelectSlot,
  onSelect,
}: SlotPickerProps) {
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
      <div className="rounded-lg border border-dashed border-line bg-panel p-3 text-center text-xs text-muted">
        No time slots available for this date. Please choose another date.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {allTaken && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>All slots are fully booked or have already passed for today. Please pick another date.</span>
        </div>
      )}

      <p className="text-xs font-semibold text-ink">Choose a time</p>

      <div className="grid grid-cols-1 gap-1.5 min-[420px]:grid-cols-2">
        {slotList.map((slotItem) => {
          const isSelected = currentSelected === slotItem.slot;
          const isAvailable = Boolean(slotItem.available);

          return (
            <button
              key={slotItem.slot}
              type="button"
              disabled={!isAvailable}
              aria-pressed={isSelected}
              onClick={() => handleSelect(slotItem.slot)}
              className={`flex h-9 items-center justify-between gap-2 rounded-lg border px-2.5 text-left text-xs font-medium transition ${FOCUS_RING} ${
                !isAvailable
                  ? "cursor-not-allowed border-line bg-gray-50 text-muted/50 opacity-60"
                  : isSelected
                  ? "border-brand bg-brand/5 font-semibold text-brand ring-2 ring-brand"
                  : "cursor-pointer border-line bg-panel text-ink hover:border-brand/40 hover:bg-gray-50/50"
              }`}
            >
              <div className="flex min-w-0 items-center gap-1.5">
                <Clock className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-brand" : "text-muted"}`} />
                <span className="truncate">{formatSlotLabel(slotItem.slot)}</span>
              </div>

              <span className="shrink-0 text-[11px]">
                {!isAvailable ? (
                  <span className="font-normal text-red-500">Unavailable</span>
                ) : slotItem.remaining !== undefined && slotItem.remaining <= 2 ? (
                  <span className="font-normal text-amber-600">{slotItem.remaining} left</span>
                ) : (
                  <span className="font-normal text-emerald-600">Available</span>
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