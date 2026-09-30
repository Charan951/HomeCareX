import { Link } from "react-router-dom";
import { Navigation } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { Booking } from "@/mocks/customerMockData";

/** Only rendered when there is a booking currently in flight (see Dashboard for the check). */
export default function ActiveBookingCard({ booking }: { booking: Booking }) {
  return (
    <Link
      to={customerPath("/tracking")}
      className={`flex items-center gap-4 rounded border border-brand-soft bg-brand-soft px-4 py-3.5 transition-opacity hover:opacity-90 ${FOCUS_RING}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Navigation className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{booking.service}</span>
        <span className="block truncate text-xs text-muted">
          {booking.status}
          {booking.partner ? ` · ${booking.partner.name} is on the way` : ""}
        </span>
      </span>
      <span className="shrink-0 text-sm font-medium text-brand">Track →</span>
    </Link>
  );
}
