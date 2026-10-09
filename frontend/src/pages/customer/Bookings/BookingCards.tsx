import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Check, MessageCircle, Phone } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import BookingThumb from "@/pages/customer/Dashboard/sections/BookingThumb";
import { customerPath } from "@/routes/customerPath";
import {
  LIVE_STEPS,
  PILL_CLASS,
  formatRating,
  formatWhen,
  getBookingCode,
  getBookingId,
  getPartner,
  getServiceName,
  getTotal,
  liveHeadline,
  liveStepIndex,
  partnerFirstName,
  pillFor,
  rupees,
  type BookingListItem,
  type Pill,
} from "./bookingModel";

/* ------------------------------------------------------------------ */
/* Shared styles                                                       */
/* ------------------------------------------------------------------ */

const CARD =
  "rounded-[20px] border border-line bg-panel shadow-[0_9px_26px_rgba(30,27,46,.07)]";

export const BTN_PRIMARY = clsx(
  "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-full bg-brand px-6 text-sm font-semibold text-white",
  "shadow-[0_8px_20px_-8px_rgba(67,56,202,.6)] transition-opacity hover:opacity-90",
  FOCUS_RING,
);

export const BTN_OUTLINE = clsx(
  "inline-flex min-h-[40px] items-center justify-center whitespace-nowrap rounded-xl border border-line bg-panel px-4 text-sm font-semibold text-ink",
  "transition-colors hover:bg-canvas",
  FOCUS_RING,
);

const ICON_BTN = clsx(
  "flex h-9 w-9 items-center justify-center rounded-full border border-line bg-panel text-brand transition-colors hover:bg-brand-soft",
  FOCUS_RING,
);

const detailsPath = (id: string) => `${customerPath("/bookings")}/${id}`;

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

export function StatusPill({ pill }: { pill: Pill }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        PILL_CLASS[pill.tone],
      )}
    >
      {pill.dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current"
        />
      )}
      {pill.label}
    </span>
  );
}

export function SectionHeading({
  id,
  title,
  count,
}: {
  id: string;
  title: string;
  count: number;
}) {
  return (
    <h2
      id={id}
      className="flex items-center gap-2 text-base font-semibold text-ink"
    >
      {title}
      <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
        {count}
      </span>
    </h2>
  );
}

/** Confirmed → En route → Arrived → In progress. Steps up to and including the current one are filled. */
function LiveTracker({ current }: { current: number }) {
  const last = LIVE_STEPS.length - 1;
  return (
    <ol aria-label="Booking progress" className="relative grid grid-cols-4">
      {/* Track and fill run between the first and last circle centres (12.5% → 87.5%). */}
      <span
        aria-hidden="true"
        className="absolute left-[12.5%] right-[12.5%] top-[10px] h-0.5 rounded-full bg-line"
      />
      <span
        aria-hidden="true"
        className="absolute left-[12.5%] top-[10px] h-0.5 rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none"
        style={{ width: `${(current / last) * 75}%` }}
      />
      {LIVE_STEPS.map((label, i) => {
        const done = i <= current;
        return (
          <li
            key={label}
            aria-current={i === current ? "step" : undefined}
            className="relative flex flex-col items-center gap-1.5 text-center"
          >
            <span
              aria-hidden="true"
              className={clsx(
                "flex h-[22px] w-[22px] items-center justify-center rounded-full",
                done ? "bg-brand text-white" : "border-2 border-line bg-panel",
              )}
            >
              {done && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span
              className={clsx(
                "text-[11px] leading-tight",
                done ? "font-medium text-ink" : "text-muted",
              )}
            >
              {label}
            </span>
            <span className="sr-only">
              {i < current
                ? "completed"
                : i === current
                  ? "current step"
                  : "upcoming"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function PartnerRow({
  booking,
  trackHref,
}: {
  booking: BookingListItem;
  trackHref: string;
}) {
  const partner = getPartner(booking);
  if (!partner) return null;
  const name = partner.name?.trim() || "Your partner";
  const first = partnerFirstName(partner) ?? "partner";
  const rating = formatRating(partner.rating);

  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        {partner.avatar ? (
          <img
            src={partner.avatar}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white"
          >
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="text-xs text-muted">
            {rating && <span className="text-amber-500">★ {rating} · </span>}
            your partner
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {partner.phone && (
          <a
            href={`tel:${partner.phone}`}
            aria-label={`Call ${first}`}
            className={ICON_BTN}
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        <Link
          to={trackHref}
          aria-label={`Chat with ${first}`}
          className={ICON_BTN}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

interface CardProps {
  booking: BookingListItem;
  now: number;
  /** Pay-now strip / payment result, owned by the page so the payment state stays in one place. */
  footer?: ReactNode;
  index?: number;
}

/** Happening now: big card with the live tracker and the partner. */
export function LiveCard({ booking, now, footer, index = 0 }: CardProps) {
  const id = getBookingId(booking);
  const name = getServiceName(booking);
  const pill = pillFor(booking, now);
  const trackHref = `${customerPath("/tracking")}?booking=${encodeURIComponent(id)}`;

  return (
    <article aria-label={`${name}, ${pill.label}`} className={CARD}>
      <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-[200px_minmax(0,1fr)_auto] md:gap-5">
        <BookingThumb
          serviceName={name}
          index={index}
          className="h-44 w-full rounded-2xl md:h-[150px] md:w-[200px]"
        />

        <div className="min-w-0">
          <StatusPill pill={pill} />
          <h3 className="mt-2 text-xl font-bold leading-tight text-ink sm:text-2xl">
            {liveHeadline(booking)}
          </h3>
          <p className="mt-1 text-base font-semibold text-ink">
            <Link
              to={detailsPath(id)}
              className={clsx("rounded hover:underline", FOCUS_RING)}
            >
              {name}
            </Link>
          </p>
          <p className="text-xs text-muted">
            {getBookingCode(booking)} · {formatWhen(booking.date, booking.slot)}
          </p>
          <div className="mt-4">
            <LiveTracker current={liveStepIndex(booking)} />
          </div>
          <PartnerRow booking={booking} trackHref={trackHref} />
        </div>

        <div className="flex items-center justify-between gap-3 md:flex-col md:items-end md:justify-center md:gap-4">
          <span className="text-xl font-bold text-ink">
            {rupees(getTotal(booking))}
          </span>
          <Link to={trackHref} className={BTN_PRIMARY}>
            Track live<span className="sr-only"> for {name}</span>
          </Link>
        </div>
      </div>
      {footer && <div className="border-t border-line">{footer}</div>}
    </article>
  );
}

/** Coming up: photo card. */
export function UpcomingCard({ booking, now, footer, index = 0 }: CardProps) {
  const id = getBookingId(booking);
  const name = getServiceName(booking);

  return (
    <article aria-label={name} className={clsx(CARD, "flex flex-col")}>
      <div className="p-3 pb-0">
        <BookingThumb
          serviceName={name}
          index={index}
          className="h-36 w-full rounded-2xl"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-semibold leading-snug text-ink">
          {name}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          {getBookingCode(booking)} · {formatWhen(booking.date, booking.slot)}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2">
          <StatusPill pill={pillFor(booking, now)} />
          <span className="text-sm font-bold text-ink">
            {rupees(getTotal(booking))}
          </span>
        </div>
        <div className="mt-4">
          <Link to={detailsPath(id)} className={BTN_OUTLINE}>
            View details<span className="sr-only"> for {name}</span>
          </Link>
        </div>
      </div>
      {footer && <div className="border-t border-line">{footer}</div>}
    </article>
  );
}

/** Completed / cancelled: compact row. Wrap rows in <HistoryList>. */
export function HistoryRow({
  booking,
  now,
  footer,
  index = 0,
  actionLabel,
  note,
}: CardProps & {
  /** "Book again" for completed, "Rebook" for cancelled. */
  actionLabel: string;
  /** Extra line after the date, e.g. the refund status. */
  note?: string;
}) {
  const id = getBookingId(booking);
  const name = getServiceName(booking);

  return (
    <li>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
        <BookingThumb
          serviceName={name}
          index={index}
          className="h-14 w-14 rounded-xl"
        />

        <div className="min-w-0 flex-1 basis-52">
          <h3 className="text-sm font-semibold text-ink">
            <Link
              to={detailsPath(id)}
              className={clsx("rounded hover:underline", FOCUS_RING)}
            >
              {name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {getBookingCode(booking)} ·{" "}
            {formatWhen(booking.date, booking.slot, true)}
            {note && <> · {note}</>}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <StatusPill pill={pillFor(booking, now)} />
          <span className="text-sm font-bold text-ink">
            {rupees(getTotal(booking))}
          </span>
          <Link to={customerPath("/services")} className={BTN_OUTLINE}>
            {actionLabel}
            <span className="sr-only"> {name}</span>
          </Link>
        </div>
      </div>
      {footer && <div className="border-t border-line">{footer}</div>}
    </li>
  );
}

export function HistoryList({
  children,
  labelledBy,
}: {
  children: ReactNode;
  labelledBy: string;
}) {
  return (
    <ul
      aria-labelledby={labelledBy}
      className={clsx(CARD, "divide-y divide-line overflow-hidden")}
    >
      {children}
    </ul>
  );
}
