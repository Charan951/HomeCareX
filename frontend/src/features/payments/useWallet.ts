import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { walletApi } from "@/services/walletApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { LedgerType, WalletData } from "@/types/payment";

export const WALLET_QUERY_KEY = ["customer-wallet"] as const;

/** GET /wallet: balance plus a page of the ledger. */
export function useWallet(page: number, type?: LedgerType, limit = 15) {
  return useQuery<WalletData, NormalizedApiError>({
    queryKey: [...WALLET_QUERY_KEY, page, type ?? "all", limit],
    queryFn: () => walletApi.get({ page, limit, ...(type ? { type } : {}) }),
    placeholderData: keepPreviousData,
  });
}
