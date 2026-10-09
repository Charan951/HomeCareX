import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, User, Wallet } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import BookingThumb from "@/pages/customer/Dashboard/sections/BookingThumb";
import { customerPath } from "@/routes/customerPath";
import type { BookingTab } from "@/types/bookingList";
import {
  formatRating,
  formatSlot,
  formatWhen,
  getBookingCode,
  getBookingId,
  getPartner,
  getServiceName,
  getTotal,
  rupees,
  type BookingListItem,
} from "../bookingModel";
import { BTN_OUTLINE } from "../BookingCards";
import { BookingStatusBadge } from "./BookingStatusBadge";

interface Props {
  booking: BookingListItem;
  tab: BookingTab;
  now: number;
  index?: number;
  note?: string;
  footer?: ReactNode;
}

export function canTrack(booking: BookingListItem, tab: BookingTab): boolean {
  if (tab === "live") return true;
  return tab === "upcoming" && booking.status !== "pending_payment";
}

function Detail({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
        <span aria-hidden="true" className="text-slate-400">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-0.5 break-words text-xs sm:text-sm font-bold text-slate-900">
        {children}
      </dd>
    </div>
  );
}

const MISSING = "font-normal text-slate-400 italic text-xs";

export function BookingCard({
  booking,
  tab,
  now,
  index = 0,
  note,
  footer,
}: Props) {
  const id = getBookingId(booking);
  const name = getServiceName(booking);
  const partner = getPartner(booking);
  const rating = formatRating(partner?.rating);
  const slot = formatSlot(booking.slot);
  const total = getTotal(booking);
  const hasTotal = total > 0;
  const detailsHref = `${customerPath("/bookings")}/${id}`;
  const trackHref = `${customerPath("/tracking")}?booking=${encodeURIComponent(id)}`;
  const headingId = `booking-${id}-title`;
  const showTrack = canTrack(booking, tab);
  const showRebook = !showTrack && (tab === "completed" || tab === "cancelled");

  return (
    <li className="flex w-full">
      <article
        aria-labelledby={headingId}
        className="relative flex w-full min-w-0 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_6px_20px_-4px_rgba(40,30,80,0.05)] transition-all hover:shadow-[0_10px_25px_-5px_rgba(40,30,80,0.08)]"
      >
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {/* Main Card Content */}
          <div className="flex flex-col gap-3 p-4">
            {/* Header: Thumbnail, Status, Code, & Title */}
            <div className="flex items-start gap-3">
              <BookingThumb
                serviceName={name}
                index={index}
                className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 object-cover shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <BookingStatusBadge booking={booking} now={now} />
                  <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                    {getBookingCode(booking)}
                  </span>
                </div>
                <h3
                  id={headingId}
                  className="mt-1 break-words text-sm sm:text-base font-bold leading-snug text-slate-900"
                >
                  <Link
                    to={detailsHref}
                    className={clsx("rounded-sm hover:text-[#5247d2] hover:underline", FOCUS_RING)}
                  >
                    {name}
                  </Link>
                </h3>
              </div>
            </div>

            {/* Spec Details 2x2 Grid */}
            <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 rounded-xl bg-[#f8f9fc] p-3">
              <Detail label="Date" icon={<CalendarDays className="h-3.5 w-3.5" />}>
                {booking.date ? (
                  formatWhen(booking.date, booking.slot, true, new Date(now))
                ) : (
                  <span className={MISSING}>Not scheduled</span>
                )}
              </Detail>
              <Detail label="Time" icon={<Clock className="h-3.5 w-3.5" />}>
                {slot || <span className={MISSING}>Not set</span>}
              </Detail>
              <Detail label="Amount" icon={<Wallet className="h-3.5 w-3.5" />}>
                {hasTotal ? (
                  rupees(total)
                ) : (
                  <span className={MISSING}>Not available</span>
                )}
              </Detail>
              <Detail label="Partner" icon={<User className="h-3.5 w-3.5" />}>
                {partner ? (
                  <span className="truncate">
                    {partner.name?.trim() || "Assigned"}
                    {rating && (
                      <span className="font-normal text-slate-500"> · ★ {rating}</span>
                    )}
                  </span>
                ) : (
                  <span className={MISSING}>Not assigned yet</span>
                )}
              </Detail>
            </dl>

            {note && <p className="text-[11px] text-slate-500">{note}</p>}

            {/* In-Card Navigation Buttons */}
            <div className="flex items-center gap-2.5">
              <Link
                to={detailsHref}
                className={clsx(
                  BTN_OUTLINE,
                  "inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50",
                )}
              >
                View Details
              </Link>

              {showTrack && (
                <Link
                  to={trackHref}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-[#eeebf9] text-xs font-semibold text-[#5247d2] transition hover:bg-[#e3dff7]"
                >
                  Track
                </Link>
              )}

              {showRebook && (
                <Link
                  to={customerPath("/services")}
                  className="inline-flex h-9 flex-1 items-center justify-center rounded-lg bg-[#eeebf9] text-xs font-semibold text-[#5247d2] transition hover:bg-[#e3dff7]"
                >
                  {tab === "completed" ? "Book again" : "Rebook"}
                </Link>
              )}
            </div>
          </div>

          {/* Footer ribbon: always present, so every card has the same height */}
          <div className="min-h-[68px] border-t border-slate-100 bg-white">
            {footer ?? (
              <div className="flex min-h-[68px] items-center gap-2 px-4 py-3 text-sm text-slate-500">
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                No payment due
              </div>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}