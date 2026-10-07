import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { paymentApi } from "@/services/paymentApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { PaymentRecordStatus, PaymentsPage } from "@/types/payment";

export const PAYMENTS_QUERY_KEY = ["customer-payments"] as const;

/** GET /payments for the signed-in customer. Keeps the old page on screen while the next one loads. */
export function usePayments(page: number, status?: PaymentRecordStatus, limit = 10) {
  return useQuery<PaymentsPage, NormalizedApiError>({
    queryKey: [...PAYMENTS_QUERY_KEY, page, status ?? "all", limit],
    queryFn: () => paymentApi.list({ page, limit, ...(status ? { status } : {}) }),
    placeholderData: keepPreviousData,
  });
}
