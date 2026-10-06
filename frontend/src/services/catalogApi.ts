import http, { type ApiResponse } from "@/lib/http";
import type { CatalogCategory, PageMeta, ServiceListParams, ServicePage } from "@/types/catalog";
import { normalizeApiError, type NormalizedApiError } from "./bookingApi";

interface ApiListResponse<T> extends ApiResponse<T> {
  meta: PageMeta;
}

export const catalogKeys = {
  categories: ["catalog", "categories"] as const,
  services: (params: ServiceListParams) => ["catalog", "services", params] as const,
};

/** Retry network blips and 5xx; never 4xx (a bad query can't be fixed by retrying). */
export const retryTransient = (failureCount: number, error: NormalizedApiError): boolean =>
  failureCount < 2 && (error.status === null || error.status >= 500);

/** GET /categories: active, admin-ordered, each with its service count. */
export async function fetchCategories(signal?: AbortSignal): Promise<CatalogCategory[]> {
  try {
    const { data } = await http.get<ApiResponse<CatalogCategory[]>>("/categories", { signal });
    return data.data;
  } catch (err) {
    throw normalizeApiError(err);
  }
}

/** GET /services with every filter, sort and page param. */
export async function fetchServices(params: ServiceListParams, signal?: AbortSignal): Promise<ServicePage> {
  try {
    const { data } = await http.get<ApiListResponse<ServicePage["items"]>>("/services", { params, signal });
    return { items: data.data, meta: data.meta };
  } catch (err) {
    throw normalizeApiError(err);
  }
}
