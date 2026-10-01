import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { pricingApi } from "@/services/pricingApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { PriceQuote, QuoteRequest } from "@/types/pricing";

const quoteKey = (req: QuoteRequest | null) => ["pricing-quote", req] as const;

export interface UseQuoteResult {
  quote: PriceQuote | undefined;
  /** First load, nothing to show yet. */
  isLoading: boolean;
  /** A newer quote is loading while the previous one is still on screen. */
  isRefreshing: boolean;
  /** `quote` is the previous request's answer, shown only until the new one arrives. Do not act on it. */
  isPlaceholder: boolean;
  isError: boolean;
  error: NormalizedApiError | null;
  refetch: () => void;
  /** Always asks the server (bypasses the cache). Use right before payment. */
  requote: () => Promise<PriceQuote>;
}

/**
 * Server price for the current draft. `request` carries only ids, quantities, date, slot and
 * the coupon code, never an amount, so there is nothing for a tampered client to inflate or cut.
 */
export function useQuote(request: QuoteRequest | null): UseQuoteResult {
  const queryClient = useQueryClient();

  // React Query hashes the key structurally, so a new-but-equal request object is the same query.
  const query = useQuery<PriceQuote, NormalizedApiError>({
    queryKey: quoteKey(request),
    queryFn: () => pricingApi.quote(request as QuoteRequest),
    enabled: request !== null,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const requote = useCallback(async (): Promise<PriceQuote> => {
    if (!request) throw new Error("Nothing to quote yet");
    return queryClient.fetchQuery({
      queryKey: quoteKey(request),
      queryFn: () => pricingApi.quote(request),
      staleTime: 0,
    });
  }, [queryClient, request]);

  return {
    quote: query.data,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    isPlaceholder: query.isPlaceholderData,
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
    requote,
  };
}