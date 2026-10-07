import http, { type ApiResponse } from "@/lib/http";
import type {
  CatalogCategory,
  PageMeta,
  ReviewSummary,
  ServiceDetail,
  ServiceListParams,
  ServicePage,
  ServiceReview,
  ServiceReviewsPage,
} from "@/types/catalog";
import { normalizeApiError, type NormalizedApiError } from "./bookingApi";

interface ApiListResponse<T> extends ApiResponse<T> {
  meta: PageMeta;
}

export const catalogKeys = {
  categories: ["catalog", "categories"] as const,
  services: (params: ServiceListParams) => ["catalog", "services", params] as const,
  service: (slug: string) => ["catalog", "service", slug] as const,
  serviceReviews: (serviceId: string, limit: number) => ["catalog", "service-reviews", serviceId, limit] as const,
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

/** GET /services/:slug: everything the details page shows. Unknown or inactive slug is a 404. */
export async function fetchServiceDetail(slug: string, signal?: AbortSignal): Promise<ServiceDetail> {
  try {
    const { data } = await http.get<ApiResponse<ServiceDetail>>(`/services/${encodeURIComponent(slug)}`, { signal });
    return data.data;
  } catch (err) {
    throw normalizeApiError(err);
  }
}

/** GET /services/:id/reviews: one page of visible reviews plus the star distribution of the whole set. */
export async function fetchServiceReviews(
  serviceId: string,
  page: number,
  limit: number,
  signal?: AbortSignal,
): Promise<ServiceReviewsPage> {
  try {
    const { data } = await http.get<ApiListResponse<{ summary: ReviewSummary; reviews: ServiceReview[] }>>(
      `/services/${encodeURIComponent(serviceId)}/reviews`,
      { params: { page, limit }, signal },
    );
    return { summary: data.data.summary, reviews: data.data.reviews, meta: data.meta };
  } catch (err) {
    throw normalizeApiError(err);
  }
}
