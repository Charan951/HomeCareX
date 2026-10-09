import type { BookingDetailView } from "@/types/bookingDetail";
import type { BookingHistoryEntry } from "@/types/booking";
import type { PillTone } from "../Bookings/bookingModel";

/* ------------------------------------------------------------------ */
/* Status pill                                                         */
/* ------------------------------------------------------------------ */

export interface StatusPill {
  label: string;
  tone: PillTone;
  /** Live statuses get a dot so they read as "happening now". */
  dot?: boolean;
}

const PILLS: Record<string, StatusPill> = {
  pending_payment: { label: "Awaiting payment", tone: "amber" },
  created: { label: "Confirmed", tone: "sky" },
  confirmed: { label: "Confirmed", tone: "sky" },
  searching_for_partner: {
    label: "Finding a partner",
    tone: "amber",
    dot: true,
  },
  assigned: { label: "Partner assigned", tone: "brand" },
  en_route: { label: "Partner on the way", tone: "brand", dot: true },
  arrived: { label: "Partner arrived", tone: "brand", dot: true },
  in_progress: { label: "In progress", tone: "brand", dot: true },
  completed: { label: "Completed", tone: "green" },
  rated: { label: "Completed", tone: "green" },
  cancelled_by_customer: { label: "Cancelled", tone: "red" },
  cancelled_by_partner: { label: "Cancelled", tone: "red" },
  cancelled_by_admin: { label: "Cancelled", tone: "red" },
  no_show: { label: "No-show", tone: "red" },
  disputed: { label: "Under review", tone: "amber" },
};

const normalizeStatus = (status?: string): string =>
  typeof status === "string" ? status.trim().toLowerCase() : "";

export const statusPill = (status: string): StatusPill => {
  const normalized = normalizeStatus(status);
  return PILLS[normalized] ?? { label: "Updating", tone: "amber" };
};

export const isCancelledStatus = (status?: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized.startsWith("cancelled") || normalized === "no_show";
};

/** The partner is on site, so extra charges can be decided. Mirrors the server rule. */
export const canDecideExtraCharges = (status: string): boolean => {
  const normalized = normalizeStatus(status);
  return normalized === "arrived" || normalized === "in_progress";
};

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

interface StepDef {
  key: string;
  label: string;
  statuses: readonly string[];
}

const STEPS: readonly StepDef[] = [
  {
    key: "confirmed",
    label: "Booking confirmed",
    statuses: ["confirmed", "created"],
  },
  {
    key: "searching",
    label: "Finding your partner",
    statuses: ["searching_for_partner"],
  },
  { key: "assigned", label: "Partner assigned", statuses: ["assigned"] },
  { key: "en_route", label: "Partner on the way", statuses: ["en_route"] },
  { key: "arrived", label: "Partner arrived", statuses: ["arrived"] },
  {
    key: "in_progress",
    label: "Service in progress",
    statuses: ["in_progress"],
  },
  {
    key: "completed",
    label: "Service completed",
    statuses: ["completed", "rated"],
  },
];

const stepIndexOf = (status: string): number =>
  STEPS.findIndex((s) => s.statuses.includes(status));

export type TimelineState = "done" | "current" | "upcoming" | "failed";

export interface TimelineItem {
  key: string;
  label: string;
  state: TimelineState;
  /** ISO time the booking reached this step, when the history has it. */
  at?: string;
}

const TERMINAL_LABEL: Record<string, string> = {
  cancelled_by_customer: "You cancelled this booking",
  cancelled_by_partner: "Cancelled by the partner",
  cancelled_by_admin: "Cancelled by HomeCareX",
  no_show: "Marked as no-show",
};

const reachedAt = (
  history: readonly BookingHistoryEntry[],
  statuses: readonly string[],
): string | undefined =>
  [...history].reverse().find((h) => statuses.includes(h.to))?.at;

/**
 * The booking's journey as a list of steps.
 * A cancelled booking keeps the steps it actually reached and ends with a red step, so the page never
 * pretends a cancelled job is still on its way.
 */
export function buildTimeline(
  booking: Pick<BookingDetailView, "status" | "statusHistory"> & {
    createdAt?: string;
  },
): TimelineItem[] {
  const history = booking.statusHistory ?? [];
  const status = normalizeStatus(booking.status);

  if (isCancelledStatus(status) || status === "disputed") {
    // Only steps the booking really went through, never ones it skipped.
    const done: TimelineItem[] = STEPS.filter(
      (s) => reachedAt(history, s.statuses) !== undefined,
    ).map((s) => ({
      key: s.key,
      label: s.label,
      state: "done",
      at: reachedAt(history, s.statuses),
    }));
    const last = history[history.length - 1];
    done.push({
      key: status,
      label:
        status === "disputed"
          ? "Booking is under review"
          : (TERMINAL_LABEL[status] ?? "Booking cancelled"),
      state: status === "disputed" ? "current" : "failed",
      at: last?.at,
    });
    return done;
  }

  const current = stepIndexOf(status);
  const finished = status === "completed" || status === "rated";

  if (current < 0) {
    return STEPS.filter((s) => reachedAt(history, s.statuses) !== undefined).map(
      (s) => ({
        key: s.key,
        label: s.label,
        state: "done",
        at: reachedAt(history, s.statuses),
      }),
    );
  }

  return STEPS.map((s, i) => ({
    key: s.key,
    label: s.label,
    state:
      finished || i < current ? "done" : i === current ? "current" : "upcoming",
    at:
      reachedAt(history, s.statuses) ??
      (s.key === "confirmed" && (finished || i <= current)
        ? booking.createdAt
        : undefined),
  }));
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** "Mon, 12 Oct 2026" from "2026-10-12". Anything unparseable is shown as the server sent it. */
export function formatLongDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || "");
  if (!m) return date || "Not scheduled";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "12 Oct, 4:05 PM" for a moment in time; empty when missing or invalid. */
export function formatMoment(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "7 Oct 2026, 03:23 PM" for the "Booked on" line; empty when missing or invalid. */
export function formatBookedOn(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d
    .toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
    .toUpperCase();
  return `${date}, ${time}`;
}

/** "Tuesday" from "2026-10-12"; empty when unparseable. */
export function weekdayOf(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || "");
  if (!m) return "";
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
  ).toLocaleDateString("en-IN", { weekday: "long" });
}

/** "12 Oct 2026" from "2026-10-12". */
export function formatPlainDate(date: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date || "");
  if (!m) return date || "";
  return new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
  ).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "2 Hours" / "90 Min" / "1 Hr 30 Min". */
export function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes} Min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return h === 1 ? "1 Hour" : `${h} Hours`;
  return `${h} Hr ${m} Min`;
}

const METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  card: "Card",
  netbanking: "Net banking",
  wallet: "Wallet",
  cod: "Pay after service",
  cash: "Cash",
};
export const paymentMethodLabel = (method?: unknown): string =>
  typeof method === "string" && method
    ? (METHOD_LABEL[method.toLowerCase()] ?? method)
    : "";

/** A map link for the address: exact pin when we have coordinates, otherwise a text search. */
export function mapsUrl(address?: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  location?: { lat: number; lng: number };
}): string | undefined {
  if (!address) return undefined;
  if (
    address.location &&
    Number.isFinite(address.location.lat) &&
    Number.isFinite(address.location.lng)
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${address.location.lat},${address.location.lng}`;
  }
  const text = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");
  return text
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(text)}`
    : undefined;
}

/* ------------------------------------------------------------------ */
/* Payment                                                             */
/* ------------------------------------------------------------------ */

export interface PaymentSummary {
  label: string;
  tone: PillTone;
  detail?: string;
}

export function paymentSummary(
  booking: Pick<BookingDetailView, "paymentStatus" | "paymentDetails">,
): PaymentSummary {
  switch (booking.paymentStatus) {
    case "PAID":
      return {
        label: "Paid",
        tone: "green",
        detail: booking.paymentDetails?.paymentId ? "Paid online" : undefined,
      };
    case "REFUNDED":
      return { label: "Refunded", tone: "sky" };
    case "FAILED":
      return { label: "Payment failed", tone: "red" };
    default:
      return booking.paymentDetails?.status === "FAILED"
        ? { label: "Payment failed", tone: "red" }
        : { label: "Payment pending", tone: "amber" };
  }
}

/* ------------------------------------------------------------------ */
/* Money                                                               */
/* ------------------------------------------------------------------ */

export interface PriceRow {
  key: string;
  label: string;
  amount: number;
  /** Shown as a deduction ("-₹100"). */
  negative?: boolean;
}

export interface PriceBreakdownModel {
  rows: PriceRow[];
  total: number;
  extraApproved: number;
  grandTotal: number;
}

/** Line items, fees and discount from the booking's price snapshot, plus approved extra charges. */
export function buildPriceBreakdown(
  booking: BookingDetailView,
): PriceBreakdownModel {
  const snap = booking.priceSnapshot;
  const rows: PriceRow[] = [];

  const lines = Array.isArray(snap?.lines) ? snap.lines : [];
  for (const [i, line] of lines.entries()) {
    rows.push({
      key: `line-${i}`,
      label:
        line.kind === "BASE"
          ? line.quantity > 1
            ? `Service Price × ${line.quantity}`
            : "Service Price"
          : line.quantity > 1
            ? `${line.name} × ${line.quantity}`
            : line.name,
      amount: Number(line.amount) || 0,
    });
  }
  if (snap?.surge)
    rows.push({
      key: "surge",
      label: "High-demand charge",
      amount: snap.surge,
    });
  if (snap?.convenienceFee)
    rows.push({
      key: "fee",
      label: "Platform Fee",
      amount: snap.convenienceFee,
    });
  if (snap?.gst) rows.push({ key: "gst", label: "Tax", amount: snap.gst });
  if (snap?.discount) {
    rows.push({
      key: "discount",
      label: snap.couponCode ? `Discount (${snap.couponCode})` : "Discount",
      amount: snap.discount,
      negative: true,
    });
  }

  const total = snap?.total ?? 0;
  const extraApproved = booking.extraChargesApprovedTotal ?? 0;
  return {
    rows,
    total,
    extraApproved,
    grandTotal: Math.round((total + extraApproved) * 100) / 100,
  };
}
