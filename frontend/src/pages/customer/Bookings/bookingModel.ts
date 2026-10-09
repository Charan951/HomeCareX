import { isExpiredHold } from "@/features/payments";
import { PAYMENT_STATUS, type BookingView } from "@/types/booking";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface PartnerLite {
  name?: string;
  rating?: number | string;
  phone?: string;
  avatar?: string;
}

/** What the list endpoint actually returns: BookingView plus a few display fields (partner is populated). */
export type BookingListItem = Omit<BookingView, "partnerId"> & {
  id?: string;
  serviceName?: string;
  categoryName?: string;
  bookingNumber?: string;
  partnerId?: string | PartnerLite;
  partner?: PartnerLite;
};

/** Which section a booking belongs to. */
export type Phase = "live" | "upcoming" | "completed" | "cancelled";

/* ------------------------------------------------------------------ */
/* Classification                                                      */
/* ------------------------------------------------------------------ */

const LIVE = new Set(["en_route", "arrived", "in_progress", "in-progress", "started"]);
const UPCOMING = new Set([
  "confirmed",
  "pending",
  "pending_payment",
  "created",
  "searching_for_partner",
  "assigned",
]);
// "disputed" and "no_show" used to match no tab, so those bookings were invisible. They now sit with
// the section the rest of the app already counts them in (see bookingStatusLabel in features/customer).
const COMPLETED = new Set(["completed", "rated", "disputed"]);

const statusOf = (b: Pick<BookingListItem, "status">): string => (b.status || "").toLowerCase();

/** An unpaid booking whose slot hold ran out is not really upcoming: it lands under Cancelled. */
export function phaseOf(b: BookingListItem, now: number): Phase | null {
  const status = statusOf(b);
  if (isExpiredHold(b, now)) return "cancelled";
  if (LIVE.has(status)) return "live";
  if (UPCOMING.has(status)) return "upcoming";
  if (COMPLETED.has(status)) return "completed";
  if (status.startsWith("cancel") || status === "no_show") return "cancelled";
  return null;
}

/** Sort key that orders bookings by when the service happens (date + slot start, 24h). */
export const whenKey = (b: BookingListItem): string => `${b.date || ""}T${(b.slot || "").slice(0, 5)}`;

/* ------------------------------------------------------------------ */
/* Display helpers                                                     */
/* ------------------------------------------------------------------ */

export const getBookingId = (b: BookingListItem): string => String(b._id || b.id || "");

export const getServiceName = (b: BookingListItem): string => {
  const baseLine = b.priceSnapshot?.lines?.find((l) => l.kind === "BASE");
  return baseLine?.name || b.serviceName || "Home Service";
};

/** Short reference code, e.g. BK-10231. */
export const getBookingCode = (b: BookingListItem): string =>
  b.bookingNumber || `BK-${getBookingId(b).slice(-5).toUpperCase()}`;

/** The populated partner object; a bare id still means "a partner is assigned". */
export function getPartner(b: BookingListItem): PartnerLite | undefined {
  if (b.partnerId && typeof b.partnerId === "object") return b.partnerId;
  if (b.partner) return b.partner;
  return b.partnerId ? {} : undefined;
}

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const amount = Number(trimmed);
    return Number.isFinite(amount) ? amount : undefined;
  }
  return undefined;
};

type PriceLike = { total?: unknown; subtotal?: unknown };

export const getTotal = (b: BookingListItem): number => {
  // Older or alternate API shapes may carry these extra fields; they aren't on BookingView.
  const extra = b as {
    priceBreakdown?: PriceLike;
    totalAmount?: unknown;
    total?: unknown;
    amount?: unknown;
  };

  const candidates = [
    b.priceSnapshot?.total,
    b.priceSnapshot?.subtotal,
    extra.priceBreakdown?.total,
    extra.priceBreakdown?.subtotal,
    extra.totalAmount,
    extra.total,
    extra.amount,
  ];

  for (const candidate of candidates) {
    const amount = asNumber(candidate);
    if (amount !== undefined) return amount;
  }

  return 0;
};

/** "₹449" / "₹1,499" / "₹379.50": whole rupees stay clean, paise are kept when present. */
export const rupees = (amount: number): string =>
  `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const partnerFirstName = (p?: PartnerLite): string | undefined => p?.name?.trim().split(/\s+/)[0];

export function formatRating(rating: PartnerLite["rating"]): string | undefined {
  const n = Number(rating);
  return rating !== undefined && rating !== "" && Number.isFinite(n) && n > 0 ? n.toFixed(1) : undefined;
}

/* ---- dates ---- */

const parseLocalDate = (iso: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const dayLabel = (d: Date, now: Date): string => {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  // Fixed abbreviations: toLocaleDateString("en-IN") spells September as "Sept".
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

/** "10:00" → "10 AM", "13:30" → "1:30 PM". */
const clock12 = (h: number, m: number): string => {
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour} ${suffix}` : `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** "10:00-12:00" → "10 AM – 12 PM". Anything we can't parse is shown as the server sent it. */
export function formatSlot(slot: string): string {
  const range = /^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/.exec(slot || "");
  if (range) return `${clock12(+range[1], +range[2])} – ${clock12(+range[3], +range[4])}`;
  const single = /^(\d{1,2}):(\d{2})$/.exec(slot || "");
  if (single) return clock12(+single[1], +single[2]);
  return slot || "";
}

/** "Today, 1 PM – 3 PM" · "4 Oct, 10 AM – 12 PM". With `dateOnly`: "Today" · "24 Sep". */
export function formatWhen(date: string, slot: string, dateOnly = false, now: Date = new Date()): string {
  const d = parseLocalDate(date);
  if (!d) return formatSlot(slot) || "Scheduled";
  const day = dayLabel(d, now);
  const time = formatSlot(slot);
  return dateOnly || !time ? day : `${day}, ${time}`;
}

/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */

export type PillTone = "amber" | "sky" | "brand" | "green" | "red";

export const PILL_CLASS: Record<PillTone, string> = {
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
  brand: "bg-brand-soft text-brand",
  green: "bg-green-50 text-green-700",
  red: "bg-danger-soft text-danger",
};

export interface Pill {
  label: string;
  tone: PillTone;
  /** Live statuses get a small dot so they read as "happening now". */
  dot?: boolean;
}

export function pillFor(b: BookingListItem, now: number): Pill {
  const s = statusOf(b);
  if (s === "pending_payment") {
    return isExpiredHold(b, now)
      ? { label: "Payment expired", tone: "red" }
      : { label: "Awaiting payment", tone: "amber" };
  }
  if (s === "en_route") return { label: "En Route", tone: "amber", dot: true };
  if (s === "arrived") return { label: "Arrived", tone: "amber", dot: true };
  if (s === "in_progress" || s === "in-progress" || s === "started") {
    return { label: "In Progress", tone: "sky", dot: true };
  }
  if (s === "assigned") return { label: "Partner Assigned", tone: "brand" };
  if (s === "completed" || s === "rated") return { label: "Completed", tone: "green" };
  if (s === "disputed") return { label: "Disputed", tone: "amber" };
  if (s === "cancelled_by_partner") return { label: "Cancelled by partner", tone: "red" };
  if (s === "no_show") return { label: "No show", tone: "red" };
  if (s.startsWith("cancel")) return { label: "Cancelled", tone: "red" };
  return { label: "Confirmed", tone: "brand" };
}

/* ------------------------------------------------------------------ */
/* Live tracking                                                       */
/* ------------------------------------------------------------------ */

export const LIVE_STEPS = ["Confirmed", "En route", "Arrived", "In progress"] as const;

/** Index of the step the booking is on (0-based). */
export function liveStepIndex(b: BookingListItem): number {
  const s = statusOf(b);
  if (s === "en_route") return 1;
  if (s === "arrived") return 2;
  if (s === "in_progress" || s === "in-progress" || s === "started") return 3;
  return 0;
}

/** Headline for a live card. The API has no ETA, so this says where things stand rather than guessing minutes. */
export function liveHeadline(b: BookingListItem): string {
  const first = partnerFirstName(getPartner(b));
  const who = first ?? "Your partner";
  switch (liveStepIndex(b)) {
    case 1:
      return `${who} is on the way`;
    case 2:
      return `${who} has arrived`;
    case 3:
      return "Your service is in progress";
    default:
      return "Getting ready";
  }
}

/* ------------------------------------------------------------------ */
/* Cancelled bookings                                                  */
/* ------------------------------------------------------------------ */

/** The money line under a cancelled booking, based on what was actually paid. */
export function cancelNote(b: BookingListItem, now: number): string {
  if (isExpiredHold(b, now)) return "Slot hold ended before payment · No money was taken";
  const total = rupees(getTotal(b));
  if (b.paymentStatus === PAYMENT_STATUS.REFUNDED) return `Refund of ${total} processed`;
  if (b.paymentStatus === PAYMENT_STATUS.PAID) return `Refund of ${total} pending`;
  return "No payment was taken";
}