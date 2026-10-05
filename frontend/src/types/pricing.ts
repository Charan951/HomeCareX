import type { BookingAddOnInput } from "./booking";

/**
 * Contracts for POST /pricing/quote (Vahidha) and POST /coupons/validate (Vaishnavi).
 * Neither backend module has shipped yet (the folders are empty stubs), so these shapes are the
 * FRONTEND'S ASSUMED CONTRACT, backed by services/pricing.mock.ts. Confirm with both owners
 * and adjust here only; the components depend on these types, not on the wire format.
 *
 * Every money field is whole rupees computed by the server. The client displays them and never
 * does price arithmetic.
 */

export interface QuoteRequest {
  serviceId: string;
  quantity: number;
  /** Ids and quantities only. Prices are looked up by the server. */
  addOns: BookingAddOnInput[];
  date: string;
  slot: string;
  couponCode?: string;
}

export interface QuoteLine {
  kind: "BASE" | "ADDON";
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export const COUPON_ERROR = {
  EXPIRED: "COUPON_EXPIRED",
  MIN_ORDER: "COUPON_MIN_ORDER",
  NOT_APPLICABLE: "COUPON_NOT_APPLICABLE",
  USAGE_LIMIT: "COUPON_USAGE_LIMIT",
  INVALID: "COUPON_INVALID",
} as const;
export type CouponErrorCode = (typeof COUPON_ERROR)[keyof typeof COUPON_ERROR];

export interface PriceQuote {
  currency: "INR";
  lines: QuoteLine[];
  /** Sum of the add-on lines. */
  addOnsTotal: number;
  /** Demand surge (0 when none) and a short reason to show next to it. */
  surge: number;
  surgeLabel?: string;
  /** base + add-ons + surge */
  subtotal: number;
  /** Server-calculated discount for `coupon`; 0 when no coupon is applied. */
  discount: number;
  convenienceFee: number;
  gst: number;
  /** What the customer pays. */
  total: number;
  /** Present only when the server accepted the coupon in the request. */
  coupon: { code: string; discount: number } | null;
  /** Set when the request carried a coupon the server no longer accepts (it was dropped). */
  couponError?: { code: CouponErrorCode; minOrder?: number };
  computedAt: string;
}

export interface CouponValidateRequest extends QuoteRequest {
  couponCode: string;
}

export interface CouponValidateResponse {
  code: string;
  /** Informational only. The discount that is charged always comes from the next quote. */
  discount: number;
}

/** One row of the "available coupons" list shown under the coupon box. */
export interface AvailableCoupon {
  code: string;
  title: string;
  description: string;
  /** Whether the server would accept this coupon for the order described in the request. */
  eligible: boolean;
  /** Why it cannot be used right now (only when eligible is false). */
  reason?: { code: CouponErrorCode; minOrder?: number };
}