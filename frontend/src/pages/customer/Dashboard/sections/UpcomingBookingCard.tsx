import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { statusBadgeClass } from "@/utils/statusBadge";
import BookingThumb from "./BookingThumb";
import { bookingStatusLabel, formatScheduled, type DashboardBookingDto } from "@/features/customer";

/** One scheduled (not yet started) booking row. */
export default function UpcomingBookingCard({ booking: b, index = 0 }: { booking: DashboardBookingDto; index?: number }) {
  const label = bookingStatusLabel(b.status);
  const address = [b.address.line1, b.address.area].filter(Boolean).join(", ");
  return (
    <Link
      to={customerPath(`/bookings/${b.id}`)}
      className={`flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-90 ${FOCUS_RING}`}
    >
      <BookingThumb serviceName={b.serviceName} index={index} className="h-12 w-12 rounded-xl" />
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
