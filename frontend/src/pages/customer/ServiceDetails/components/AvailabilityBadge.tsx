import { CalendarClock, CalendarX2 } from "lucide-react";
import clsx from "clsx";
import type { SlotAvailability } from "@/types/catalog";
import { formatSlotDay } from "../format";

/**
 * Whether a slot is free in the next 7 days. Three honest states: slots (with the first day),
 * none in the window, and "couldn't check" (the slot service was unreachable, so we never claim "no slots").
 */
export default function AvailabilityBadge({ availability, className }: { availability: SlotAvailability; className?: string }) {
  const { hasSlots, nextAvailableDate, windowDays } = availability;

  if (hasSlots === true) {
    return (
      <div role="status" className={clsx("flex items-center gap-3 rounded-2xl border border-[#BBE5CB] bg-[#EAF7F0] px-3 py-2", className)}>
        <span className="relative flex h-2.5 w-2.5 shrink-0 text-[#16A34A] sd-ping" aria-hidden="true">
          <span className="relative h-2.5 w-2.5 rounded-full bg-[#16A34A]" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#14532D]">Slots open this week</p>
          {nextAvailableDate && <p className="text-xs text-[#166534]">Earliest: {formatSlotDay(nextAvailableDate)}</p>}
        </div>
      </div>
    );
  }

  if (hasSlots === false) {
    return (
      <div role="status" className={clsx("flex items-center gap-3 rounded-2xl border border-[#F6D9A8] bg-[#FFF6E5] px-3 py-2", className)}>
        <CalendarX2 className="h-5 w-5 shrink-0 text-[#B45309]" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#7C2D12]">Fully booked for {windowDays} days</p>
          <p className="text-xs text-[#9A3412]">New times open up often. Check again soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div role="status" className={clsx("flex items-center gap-3 rounded-2xl border border-line bg-canvas px-3 py-2", className)}>
      <CalendarClock className="h-5 w-5 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t check availability</p>
        <p className="text-xs text-muted">You&apos;ll see open times when you book.</p>
      </div>
    </div>
  );
}
