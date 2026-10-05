import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { catalogKeys, fetchServices, retryTransient } from "@/services/catalogApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { ServiceListParams, ServicePage } from "@/types/catalog";

/**
 * One page of the catalog for the given filters. The previous page stays on screen (isPlaceholderData)
 * while the next one loads, so changing a filter or page never flashes an empty or skeleton grid.
 */
export function useServices(params: ServiceListParams) {
  return useQuery<ServicePage, NormalizedApiError>({
    queryKey: catalogKeys.services(params),
    queryFn: ({ signal }) => fetchServices(params, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    retry: retryTransient,
  });
}
