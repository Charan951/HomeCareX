import { useQuery } from "@tanstack/react-query";
import { pricingApi } from "@/services/pricingApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { AvailableCoupon, QuoteRequest } from "@/types/pricing";

/**
 * Coupons the customer can see for this order, each flagged eligible or not by the server.
 * Display only: applying one still goes through POST /coupons/validate and a fresh quote.
 */
export function useAvailableCoupons(request: QuoteRequest | null) {
  const query = useQuery<AvailableCoupon[], NormalizedApiError>({
    queryKey: ["available-coupons", request],
    queryFn: () => pricingApi.listCoupons(request as QuoteRequest),
    enabled: request !== null,
    staleTime: 60_000,
  });
  return { coupons: query.data ?? [], isLoading: query.isLoading, isError: query.isError };
}