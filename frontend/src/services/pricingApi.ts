import http, { type ApiResponse } from "@/lib/http";
import type { AvailableCoupon, CouponValidateRequest, CouponValidateResponse, PriceQuote, QuoteRequest } from "@/types/pricing";
import { normalizeApiError, type NormalizedApiError } from "./bookingApi";
import { pricingMock } from "./pricing.mock";

/**
 * true  -> prices and coupons come from services/pricing.mock.ts (default until the backend modules merge)
 * false -> the real POST /pricing/quote and POST /coupons/validate are called
 * Flip it with VITE_MOCK_PRICING=false in frontend/.env.
 */
export const PRICING_IS_MOCK = import.meta.env.VITE_MOCK_PRICING !== "false";

/** lib/http rejects with a plain { message, status, code, details }; other clients reject with AxiosError. */
function toNormalized(err: unknown): NormalizedApiError {
  if (err && typeof err === "object" && "message" in err && "status" in err && !("isAxiosError" in err)) {
    const e = err as { message: string; status?: number; code?: string; details?: unknown };
    return { status: e.status ?? 0, code: e.code ?? "UNKNOWN_ERROR", message: e.message, details: e.details };
  }
  return normalizeApiError(err);
}

export const pricingApi = {
  async quote(req: QuoteRequest): Promise<PriceQuote> {
    if (PRICING_IS_MOCK) return pricingMock.quote(req);
    try {
      const { data } = await http.post<ApiResponse<PriceQuote>>("/pricing/quote", req);
      return data.data;
    } catch (err) {
      throw toNormalized(err);
    }
  },

  /** Assumed contract: POST /coupons/available with the same body as a quote, returns AvailableCoupon[]. */
  async listCoupons(req: QuoteRequest): Promise<AvailableCoupon[]> {
    if (PRICING_IS_MOCK) return pricingMock.listCoupons(req);
    try {
      const { data } = await http.post<ApiResponse<AvailableCoupon[]>>("/coupons/available", req);
      return data.data;
    } catch (err) {
      throw toNormalized(err);
    }
  },

  async validateCoupon(req: CouponValidateRequest): Promise<CouponValidateResponse> {
    if (PRICING_IS_MOCK) return pricingMock.validateCoupon(req);
    try {
      const { data } = await http.post<ApiResponse<CouponValidateResponse>>("/coupons/validate", req);
      return data.data;
    } catch (err) {
      throw toNormalized(err);
    }
  },
};