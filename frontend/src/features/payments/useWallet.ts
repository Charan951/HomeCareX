import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { walletApi } from "@/services/walletApi";
import { useAuth } from "@/context/AuthContext";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { LedgerType, WalletData } from "@/types/payment";

export const WALLET_QUERY_KEY = ["customer-wallet"] as const;

/** GET /wallet: balance plus a page of the ledger. */
export function useWallet(page: number, type?: LedgerType, limit = 15) {
  // Reactive auth state (unlike tokenStore.get(), which React can't observe).
  const { isAuthenticated } = useAuth();

  return useQuery<WalletData, NormalizedApiError>({
    queryKey: [...WALLET_QUERY_KEY, page, type ?? "all", limit],
    queryFn: () => walletApi.get({ page, limit, ...(type ? { type } : {}) }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    // Only runs once the session has been confirmed (restore or login)
    enabled: isAuthenticated,
  });
}