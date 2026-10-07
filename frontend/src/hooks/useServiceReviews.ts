import { useInfiniteQuery } from "@tanstack/react-query";
import { catalogKeys, fetchServiceReviews, retryTransient } from "@/services/catalogApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { ServiceReviewsPage } from "@/types/catalog";

export const REVIEWS_PAGE_SIZE = 4;

/** Visible reviews of one service, loaded a few at a time ("Show more"). The summary rides on every page. */
export function useServiceReviews(serviceId: string | undefined) {
  return useInfiniteQuery<ServiceReviewsPage, NormalizedApiError, { pages: ServiceReviewsPage[] }, ReturnType<typeof catalogKeys.serviceReviews>, number>({
    queryKey: catalogKeys.serviceReviews(serviceId ?? "", REVIEWS_PAGE_SIZE),
    queryFn: ({ pageParam, signal }) => fetchServiceReviews(serviceId as string, pageParam, REVIEWS_PAGE_SIZE, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
    enabled: Boolean(serviceId),
    staleTime: 60_000,
    retry: retryTransient,
  });
}
