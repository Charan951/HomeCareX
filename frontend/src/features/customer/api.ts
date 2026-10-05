import { useQuery } from "@tanstack/react-query";
import http, { type ApiResponse } from "@/lib/http";
import { useAuth } from "@/hooks/useAuth";
import { normalizeApiError, type NormalizedApiError } from "@/services/bookingApi";
import type { CustomerDashboardDto } from "./types";

export const customerKeys = {
  /** Keyed by user id so one customer's cached dashboard can never be shown to another. */
  addresses: (userId: string | undefined) => ["customer", "addresses", userId ?? "anonymous"] as const,
  dashboard: (userId: string | undefined) => ["customer", "dashboard", userId ?? "anonymous"] as const,
};

/**
 * GET /customer/dashboard. The server works out who you are from the bearer token
 * (lib/http attaches it) — we never send a customer id.
 */
export async function fetchCustomerDashboard(): Promise<CustomerDashboardDto> {
  try {
    const { data } = await http.get<ApiResponse<CustomerDashboardDto>>("/customer/dashboard");
    return data.data;
  } catch (err) {
    throw normalizeApiError(err);
  }
}

/** Everything the customer home screen needs, in one request. */
export function useCustomerDashboard() {
  const { user } = useAuth();
  return useQuery<CustomerDashboardDto, NormalizedApiError>({
    queryKey: customerKeys.dashboard(user?.id),
    queryFn: fetchCustomerDashboard,
    staleTime: 30_000,
    // Retry network blips / 5xx, but not 4xx (wrong role, bad token) — retrying can't fix those.
    retry: (failureCount, error) => failureCount < 2 && (error.status === null || error.status >= 500),
  });
}
