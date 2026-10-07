import type { NormalizedApiError } from "./bookingApi";
import { fetchServiceDetail } from "./catalogApi";
import {
  COUPON_ERROR,
  type CouponErrorCode,
  type AvailableCoupon,
  type CouponValidateRequest,
  type CouponValidateResponse,
  type PriceQuote,
  type QuoteLine,
  type QuoteRequest,
} from "@/types/pricing";

/**
 * STAND-IN FOR THE SERVER until POST /pricing/quote and POST /coupons/validate are merged.
 * It plays the role of the backend: all price maths lives here, the UI only displays the result.
 * Service and add-on data (ids, base price, add-on prices) is the REAL catalog (GET /services/:id),
 * the same rows POST /bookings validates against. Only fees, GST, surge and coupons are simulated.
 * Delete this file (and the PRICING_IS_MOCK branch in pricingApi.ts) when the real endpoints ship.
 */

const CONVENIENCE_FEE = 29;
const GST_RATE = 0.18;
const SURGE_RATE = 0.1;
const SURGE_FROM_HOUR = 18; // evening slots carry a surge in the mock
const LATENCY_MS = 450;

interface MockCoupon {
  title: string;
  description: string;
  kind: "FLAT" | "PERCENT";
  value: number;
  maxDiscount?: number;
  minOrder?: number;
  expired?: boolean;
  usageLimitReached?: boolean;
  onlyServiceSlugs?: string[];
}

const MOCK_COUPONS: Record<string, MockCoupon> = {
  SAVE200: { title: "Flat ₹200 off", description: "On orders of ₹500 and above", kind: "FLAT", value: 200, minOrder: 500 },
  WELCOME10: { title: "10% off", description: "Up to ₹300 off on any service", kind: "PERCENT", value: 10, maxDiscount: 300 },
  OLDDEAL: { title: "Flat ₹100 off", description: "Festive offer", kind: "FLAT", value: 100, expired: true },
  BIGSPENDER: { title: "Flat ₹500 off", description: "On orders of ₹10,000 and above", kind: "FLAT", value: 500, minOrder: 10000 },
  ACONLY: { title: "Flat ₹100 off", description: "Only on AC Service & Gas Refill", kind: "FLAT", value: 100, onlyServiceSlugs: ["ac-service-gas-refill"] },
  SOLDOUT: { title: "Flat ₹100 off", description: "Limited-period offer", kind: "FLAT", value: 100, usageLimitReached: true },
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function fail(status: number, code: string, message: string, details?: unknown): never {
  const err: NormalizedApiError = { status, code, message, details };
  throw err;
}

/** Reads the service from the real catalog. GET /services/:idOrSlug accepts the id the wizard sends. */
async function loadService(serviceId: string) {
  try {
    return await fetchServiceDetail(serviceId);
  } catch (err) {
    if ((err as Partial<NormalizedApiError>)?.status === 404) fail(404, "SERVICE_NOT_FOUND", "That service was not found");
    throw err;
  }
}

async function priceLines(req: QuoteRequest) {
  const service = await loadService(req.serviceId);

  const lines: QuoteLine[] = [
    {
      kind: "BASE",
      refId: service.id,
      name: service.name,
      unitPrice: service.basePrice,
      quantity: req.quantity,
      amount: service.basePrice * req.quantity,
    },
  ];
  for (const a of req.addOns) {
    const addOn = service.addOns.find((x) => x.id === a.addOnId);
    if (!addOn) fail(422, "ADDON_NOT_FOUND", "One of the selected add-ons is not available for this service");
    lines.push({
      kind: "ADDON",
      refId: addOn.id,
      name: addOn.name,
      unitPrice: addOn.price,
      quantity: a.quantity,
      amount: addOn.price * a.quantity,
    });
  }
  return { service, lines };
}

/** Returns an error code when the coupon cannot be used for this order, otherwise the discount. */
function evaluateCoupon(
  code: string,
  slug: string,
  orderValue: number,
): { ok: true; discount: number } | { ok: false; code: CouponErrorCode; minOrder?: number } {
  const coupon = MOCK_COUPONS[code.trim().toUpperCase()];
  if (!coupon) return { ok: false, code: COUPON_ERROR.INVALID };
  if (coupon.expired) return { ok: false, code: COUPON_ERROR.EXPIRED };
  if (coupon.usageLimitReached) return { ok: false, code: COUPON_ERROR.USAGE_LIMIT };
  if (coupon.onlyServiceSlugs && !coupon.onlyServiceSlugs.includes(slug)) {
    return { ok: false, code: COUPON_ERROR.NOT_APPLICABLE };
  }
  if (coupon.minOrder !== undefined && orderValue < coupon.minOrder) {
    return { ok: false, code: COUPON_ERROR.MIN_ORDER, minOrder: coupon.minOrder };
  }
  const raw = coupon.kind === "FLAT" ? coupon.value : Math.round((orderValue * coupon.value) / 100);
  const discount = Math.min(raw, coupon.maxDiscount ?? raw, orderValue);
  return { ok: true, discount };
}

type PricedOrder = Awaited<ReturnType<typeof priceLines>>;

function buildQuote(req: QuoteRequest, priced: PricedOrder): PriceQuote {
  const { service, lines } = priced;
  const baseAmount = lines[0].amount;
  const addOnsTotal = lines.slice(1).reduce((sum, l) => sum + l.amount, 0);
  const hasSurge = Number.parseInt(req.slot.slice(0, 2), 10) >= SURGE_FROM_HOUR;
  const surge = hasSurge ? Math.round((baseAmount + addOnsTotal) * SURGE_RATE) : 0;
  const subtotal = baseAmount + addOnsTotal + surge;

  let discount = 0;
  let coupon: PriceQuote["coupon"] = null;
  let couponError: PriceQuote["couponError"];
  if (req.couponCode) {
    const result = evaluateCoupon(req.couponCode, service.slug, subtotal);
    if (result.ok) {
      discount = result.discount;
      coupon = { code: req.couponCode.trim().toUpperCase(), discount };
    } else {
      couponError = { code: result.code, minOrder: result.minOrder };
    }
  }

  const gst = Math.round((subtotal - discount + CONVENIENCE_FEE) * GST_RATE);
  return {
    currency: "INR",
    lines,
    addOnsTotal,
    surge,
    surgeLabel: hasSurge ? "Evening demand" : undefined,
    subtotal,
    discount,
    convenienceFee: CONVENIENCE_FEE,
    gst,
    total: subtotal - discount + CONVENIENCE_FEE + gst,
    coupon,
    couponError,
    computedAt: new Date().toISOString(),
  };
}

export const pricingMock = {
  async quote(req: QuoteRequest): Promise<PriceQuote> {
    await wait(LATENCY_MS);
    return buildQuote(req, await priceLines(req));
  },

  async listCoupons(req: QuoteRequest): Promise<AvailableCoupon[]> {
    await wait(LATENCY_MS / 2);
    const priced = await priceLines(req);
    const { service } = priced;
    const orderValue = buildQuote({ ...req, couponCode: undefined }, priced).subtotal;
    return Object.entries(MOCK_COUPONS).map(([code, c]) => {
      const result = evaluateCoupon(code, service.slug, orderValue);
      return {
        code,
        title: c.title,
        description: c.description,
        eligible: result.ok,
        ...(result.ok ? {} : { reason: { code: result.code, minOrder: result.minOrder } }),
      };
    });
  },

  async validateCoupon(req: CouponValidateRequest): Promise<CouponValidateResponse> {
    await wait(LATENCY_MS);
    const priced = await priceLines(req);
    const { service } = priced;
    const orderValue = buildQuote({ ...req, couponCode: undefined }, priced).subtotal;
    const result = evaluateCoupon(req.couponCode, service.slug, orderValue);
    if (!result.ok) {
      fail(422, result.code, "Coupon cannot be applied", result.minOrder ? { minOrder: result.minOrder } : undefined);
    }
    return { code: req.couponCode.trim().toUpperCase(), discount: result.discount };
  },
};