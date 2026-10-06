import { useQuery } from "@tanstack/react-query";
import { catalogKeys, fetchCategories, retryTransient } from "@/services/catalogApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { CatalogCategory } from "@/types/catalog";

/** Active categories in admin order, with service counts. Categories change rarely, so cache for 5 min. */
export function useCategories() {
  return useQuery<CatalogCategory[], NormalizedApiError>({
    queryKey: catalogKeys.categories,
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 5 * 60_000,
    retry: retryTransient,
  });
}
