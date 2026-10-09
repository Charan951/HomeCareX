import { useQuery } from "@tanstack/react-query";
import { catalogKeys, fetchCategories, retryTransient } from "@/services/catalogApi";
import type { NormalizedApiError } from "@/services/bookingApi";
import type { CatalogCategory } from "@/types/catalog";

/** Active categories in admin order, with service counts. Short cache + refetch on focus so admin reordering shows up quickly. */
export function useCategories() {
  return useQuery<CatalogCategory[], NormalizedApiError>({
    queryKey: catalogKeys.categories,
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    retry: retryTransient,
  });
}