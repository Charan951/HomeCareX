import type { BookingStatus } from "./bookings.constants";
import {
  PARTNER_CONTACT_STATUSES,
  START_OTP_STATUS,
} from "./bookings.constants";

/**
 * The customer-facing shape of ONE booking (GET /bookings/:id).
 *
 * Pure on purpose (no DB, no Express) so the privacy rules can be unit tested:
 *  - internal fields never leave the server (partner earning, offers, OTP storage, idempotency data)
 *  - the start OTP is only included while the partner has arrived
 *  - the partner's phone is only included while the job is active
 */

/** Keys that are internal to the platform and must never reach a customer. */
export const INTERNAL_KEYS = [
  "requestHash",
  "idempotencyKey",
  "slotSeat",
  "__v",
  "otp",
  "otpCodes",
  "offers",
  "partnerEarning",
] as const;

export interface PartnerView {
  name?: string;
  phone?: string;
  city?: string;
  rating?: number;
  ratingCount?: number;
  verified?: boolean;
}

/** Catalog details of the booked service, looked up by the service layer. */
export interface ServiceInfo {
  name?: string;
  description?: string;
  image?: string;
  durationMinutes?: number;
  categoryName?: string;
}

/** Latest payment attempt for the booking (Payment collection). */
export interface PaymentInfo {
  /** Payment collection status: PAID, FAILED, REFUNDED, PENDING... */
  status?: string;
  method?: string;
  transactionId?: string;
  paidAt?: unknown;
}

export interface DetailExtras {
  service?: ServiceInfo | null;
  payment?: PaymentInfo | null;
}

export interface ExtraChargeView {
  _id: string;
  title: string;
  reason?: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  requestedAt?: unknown;
  decidedAt?: unknown;
}

interface PopulatedPartner {
  _id?: unknown;
  city?: string;
  ratingAvg?: number;
  ratingCount?: number;
  userId?: { name?: string; phone?: string } | null;
  kyc?: { status?: string } | null;
}

/**
 * A populated Partner document, as opposed to a bare ObjectId.
 * A bare ObjectId carries `_bsontype`; a populated document has an `_id` and no `_bsontype`.
 * (The old check looked for `userId`/`ratingAvg`, so a partner without either was treated as an id.)
 */
const isPopulatedPartner = (value: unknown): value is PopulatedPartner =>
  typeof value === "object" &&
  value !== null &&
  !("_bsontype" in value) &&
  "_id" in value;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Payment record statuses that mean the money was received. */
const PAID_STATES = new Set([
  "PAID",
  "SUCCESS",
  "SUCCEEDED",
  "CAPTURED",
  "COMPLETED",
  "SETTLED",
]);
function toPartner(
  raw: unknown,
  status: BookingStatus,
): { partnerId?: string; partner: PartnerView | null } {
  if (!raw) return { partner: null };
  if (!isPopulatedPartner(raw))
    return { partnerId: String(raw), partner: null };

  const user = raw.userId ?? undefined;
  // Only set keys that have a value, so the view never carries `key: undefined`
  // (it breaks deep-equality in tests and adds noise to the payload).
  const partner: PartnerView = {};
  if (user?.name !== undefined) partner.name = user.name;
  if (typeof raw.city === "string" && raw.city.trim()) partner.city = raw.city;
  if (typeof raw.ratingAvg === "number") partner.rating = raw.ratingAvg;
  if (typeof raw.ratingCount === "number")
    partner.ratingCount = raw.ratingCount;
  if (raw.kyc?.status === "approved") partner.verified = true;
  if (PARTNER_CONTACT_STATUSES.includes(status) && user?.phone)
    partner.phone = user.phone;
  return {
    partnerId: raw._id === undefined ? undefined : String(raw._id),
    partner,
  };
}

function toExtraCharges(raw: unknown): ExtraChargeView[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c: Record<string, unknown>) => ({
    _id: String(c._id),
    title: String(c.title ?? ""),
    reason: typeof c.reason === "string" ? c.reason : undefined,
    amount: Number(c.amount ?? 0),
    status: (c.status as ExtraChargeView["status"]) ?? "pending",
    requestedAt: c.requestedAt,
    decidedAt: c.decidedAt,
  }));
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const two = (n: number): string => String(n).padStart(2, "0");

/** "YYYY-MM-DD" and "HH:mm" of an instant in Asia/Kolkata. */
function istParts(at: Date): { date: string; time: string; minutes: number } {
  const d = new Date(at.getTime() + IST_OFFSET_MS);
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  return {
    date: `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`,
    time: `${two(h)}:${two(m)}`,
    minutes: h * 60 + m,
  };
}

const num = (v: unknown): number =>
  typeof v === "number" && Number.isFinite(v) ? v : 0;
const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

/** Bookings made on the partner/seed side have `address`, `scheduledAt` and `priceBreakdown` but no customer snapshots. */
function withFallbacks(
  view: Record<string, unknown>,
  service?: ServiceInfo | null,
): void {
  // Address
  const snap = view.addressSnapshot;
  const hasSnap =
    isObj(snap) && typeof snap.line1 === "string" && snap.line1.trim() !== "";
  if (
    !hasSnap &&
    isObj(view.address) &&
    typeof view.address.line1 === "string"
  ) {
    const a = view.address;
    view.addressSnapshot = {
      line1: a.line1,
      line2: typeof a.area === "string" ? a.area : undefined,
      city: typeof a.city === "string" ? a.city : "",
      state: "",
      pincode: typeof a.pincode === "string" ? a.pincode : "",
    };
  }

  // Date and slot
  const at =
    view.scheduledAt instanceof Date
      ? view.scheduledAt
      : view.scheduledAt
        ? new Date(String(view.scheduledAt))
        : null;
  if (at && !Number.isNaN(at.getTime())) {
    const p = istParts(at);
    if (!view.date) view.date = p.date;
    if (!view.slot) {
      const dur = service?.durationMinutes;
      if (dur && p.minutes + dur < 24 * 60) {
        const end = p.minutes + dur;
        view.slot = `${p.time}-${two(Math.floor(end / 60))}:${two(end % 60)}`;
      } else {
        view.slot = p.time;
      }
    }
  }

  // Price
  const ps = view.priceSnapshot;
  const psTotal = isObj(ps) ? num(ps.total) : 0;
  const pb = isObj(view.priceBreakdown) ? view.priceBreakdown : null;
  if (psTotal <= 0 && pb && num(pb.total) > 0) {
    const name = String(view.serviceName ?? service?.name ?? "Service");
    const lines: Array<Record<string, unknown>> = [];
    if (num(pb.base) > 0)
      lines.push({
        kind: "BASE",
        refId: String(view.serviceId ?? ""),
        name,
        unitPrice: num(pb.base),
        quantity: 1,
        amount: num(pb.base),
      });
    if (num(pb.addOns) > 0)
      lines.push({
        kind: "ADDON",
        refId: "",
        name: "Add-ons",
        unitPrice: num(pb.addOns),
        quantity: 1,
        amount: num(pb.addOns),
      });
    view.priceSnapshot = {
      currency: "INR",
      lines,
      subtotal: num(pb.base) + num(pb.addOns),
      discount: num(pb.discount),
      convenienceFee: num(pb.convenienceFee),
      surge: num(pb.surge) || undefined,
      gst: num(pb.tax) || undefined,
      total: num(pb.total),
    };
  }
}

export function buildDetailView(
  raw: Record<string, unknown>,
  startOtp: string | null,
  extras: DetailExtras = {},
): Record<string, unknown> {
  const status = raw.status as BookingStatus;
  const view: Record<string, unknown> = { ...raw };
  for (const key of INTERNAL_KEYS) delete view[key];

  const { partnerId, partner } = toPartner(raw.partnerId, status);
  if (partnerId === undefined) delete view.partnerId;
  else view.partnerId = partnerId;
  view.partner = partner;

  const extraCharges = toExtraCharges(raw.extraCharges);
  view.extraCharges = extraCharges;
  view.extraChargesApprovedTotal = round2(
    extraCharges
      .filter((c) => c.status === "approved")
      .reduce((sum, c) => sum + c.amount, 0),
  );

  view.startOtp = status === START_OTP_STATUS && startOtp ? startOtp : null;

  withFallbacks(view, extras.service);
  view.service = extras.service ?? null;
  const pd: Record<string, unknown> = isObj(view.paymentDetails)
    ? { ...view.paymentDetails }
    : {};
  delete pd.signature;
  // The Payment record is the source of truth. If it says the money was received (or refunded) but the
  // booking's own paymentStatus was never updated, show the real state instead of "Payment pending".
  const payState = String(extras.payment?.status ?? "").toUpperCase();
  // A finished job is settled: the partner collected cash, or the customer paid online. Either way the
  // customer must not see "Payment pending" on a completed booking, even when there is no Payment record
  // (pay-after-service, partner-side or seeded bookings). Failed or refunded payments are never overridden.
  const completedSettled =
    (status === "completed" || status === "rated") &&
    payState !== "FAILED" &&
    payState !== "REFUNDED" &&
    view.paymentStatus !== "REFUNDED" &&
    view.paymentStatus !== "FAILED";

  if (payState === "REFUNDED") view.paymentStatus = "REFUNDED";
  else if (
    view.paymentStatus !== "REFUNDED" &&
    (PAID_STATES.has(payState) || Boolean(pd.paidAt) || completedSettled)
  ) {
    view.paymentStatus = "PAID";
  }

  view.paymentDetails = {
    ...pd,
    method: extras.payment?.method,
    transactionId:
      extras.payment?.transactionId ??
      (typeof pd.paymentId === "string" ? pd.paymentId : undefined),
    paidAt:
      pd.paidAt ??
      extras.payment?.paidAt ??
      (completedSettled ? raw.completedAt : undefined),
  };
  return view;
}
