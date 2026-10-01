import { Link } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";
import { statusBadgeClass } from "@/utils/statusBadge";
import type { Booking } from "@/mocks/customerMockData";

/** Bookings that are confirmed or in flight — distinct from full booking history. */
export default function UpcomingBookings({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="space-y-3">
      {bookings.map((b) => (
        <Link
          key={b.id}
          to={b.status === "In Progress" ? customerPath("/tracking") : customerPath(`/bookings/${b.id}`)}
          className="flex items-center justify-between border-b border-line py-2 last:border-0"
        >
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-ink">{b.service}</div>
            <div className="truncate text-xs text-muted">{b.scheduledAt} · {b.address}</div>
          </div>
          <span className={`ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(b.status)}`}>{b.status}</span>
        </Link>
      ))}
    </div>
  );
}
