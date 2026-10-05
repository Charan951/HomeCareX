import { Link } from "react-router-dom";
import { CalendarClock, MapPin } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { statusBadgeClass } from "@/utils/statusBadge";
import { bookingStatusLabel, formatScheduled, type DashboardBookingDto } from "@/features/customer";

/** One scheduled (not yet started) booking row. */
export default function UpcomingBookingCard({ booking: b }: { booking: DashboardBookingDto }) {
  const label = bookingStatusLabel(b.status);
  const address = [b.address.line1, b.address.area].filter(Boolean).join(", ");
  return (
    <Link
      to={customerPath(`/bookings/${b.id}`)}
      className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-90 ${FOCUS_RING}`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-canvas text-brand" aria-hidden="true">
        <CalendarClock className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-semibold leading-snug text-ink">{b.serviceName}</span>
        <span className="block truncate text-xs text-muted">{formatScheduled(b.scheduledAt)}</span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{address}</span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(label)}`}>{label}</span>
        <span className="text-xs font-medium text-ink">₹{b.total}</span>
      </span>
    </Link>
  );
}
