import { useQuery } from "@tanstack/react-query";
import { catalogKeys, fetchServiceDetail, retryTransient } from "@/services/catalogApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { ServiceDetail } from "@/types/catalog";

/** One service for the details page. A 404 (unknown or inactive slug) is never retried. */
export function useService(slug: string | undefined) {
  return useQuery<ServiceDetail, NormalizedApiError>({
    queryKey: catalogKeys.service(slug ?? ""),
    queryFn: ({ signal }) => fetchServiceDetail(slug as string, signal),
    enabled: Boolean(slug),
    staleTime: 60_000,
    retry: retryTransient,
  });
}
