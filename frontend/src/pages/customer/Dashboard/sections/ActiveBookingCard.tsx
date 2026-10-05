import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { statusBadgeClass } from "@/utils/statusBadge";
import BookingThumb from "./BookingThumb";
import { bookingStatusLabel, formatScheduled, type DashboardBookingDto } from "@/features/customer";

const TOTAL_STEPS = 4;

function statusHint(b: DashboardBookingDto): string {
  const who = b.partnerName ?? "Your partner";
  if (b.status === "en_route") return `${who} is on the way`;
  if (b.status === "arrived") return `${who} has arrived`;
  if (b.status === "in_progress") return `${who} is working on it`;
  return formatScheduled(b.scheduledAt);
}

/**
 * One card listing every booking currently in flight (En Route / Arrived / In Progress).
 * Each row: booking title, live status pill, a progress bar and a short status line.
 * Rows open live tracking for that booking.
 */
export default function ActiveBookingCard({ bookings }: { bookings: DashboardBookingDto[] }) {
  return (
    <section aria-labelledby="active-bookings-title" className="rounded-[20px] border border-white bg-white shadow-[0_9px_26px_rgba(30,27,46,.07)]">
      <div className="flex items-center justify-between px-3 pb-2 pt-4 sm:px-5">
        <h2 id="active-bookings-title" className="flex items-center gap-2 text-base font-semibold text-ink">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
          </span>
          Active bookings
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">{bookings.length}</span>
        </h2>
        <Link to={customerPath("/bookings")} className={clsx("rounded text-sm font-medium text-brand", FOCUS_RING)}>
          View all
        </Link>
      </div>

      <ul className="divide-y divide-line">
        {bookings.map((b, bi) => {
          const label = bookingStatusLabel(b.status);
          return (
            <li key={b.id}>
              <Link
                to={`${customerPath("/tracking")}?booking=${encodeURIComponent(b.id)}`}
                className={clsx("flex items-center gap-3 px-3 py-3.5 transition-colors hover:bg-canvas sm:px-5 sm:py-4", FOCUS_RING)}
              >
                <BookingThumb serviceName={b.serviceName} index={bi} className="h-12 w-12 rounded-2xl sm:h-14 sm:w-14" />

                <span className="min-w-0 flex-1">
                  <span className="flex flex-col items-start gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                    <span className="break-words text-sm font-semibold leading-snug text-ink">{b.serviceName}</span>
                    <span className={clsx("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", statusBadgeClass(label))}>
                      {label}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-muted">{statusHint(b)}</span>
                  <span className="block text-xs leading-snug text-muted">{formatScheduled(b.scheduledAt)}</span>
                  <span
                    role="img"
                    aria-label={`Progress: ${label}, step ${b.progressStep} of ${TOTAL_STEPS}`}
                    className="mt-2.5 flex gap-1"
                  >
                    {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                      <span
                        key={i}
                        style={{ "--i": i } as React.CSSProperties}
                        className={clsx("h-1.5 flex-1 rounded-full", i < b.progressStep ? "bar-fill bg-brand" : "bg-line")}
                      />
                    ))}
                  </span>
                </span>

                <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted sm:block" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
