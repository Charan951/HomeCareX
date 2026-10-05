import { useMutation } from "@tanstack/react-query";
import { pricingApi } from "@/services/pricingApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { CouponValidateRequest, CouponValidateResponse } from "@/types/pricing";

export interface UseValidateCouponResult {
  validate: (req: CouponValidateRequest) => Promise<CouponValidateResponse>;
  isValidating: boolean;
  reset: () => void;
}

/** POST /coupons/validate. Resolves only when the server accepts the code for this order. */
export function useValidateCoupon(): UseValidateCouponResult {
  const mutation = useMutation<CouponValidateResponse, NormalizedApiError, CouponValidateRequest>({
    mutationFn: (req) => pricingApi.validateCoupon(req),
  });
  return { validate: mutation.mutateAsync, isValidating: mutation.isPending, reset: mutation.reset };
}