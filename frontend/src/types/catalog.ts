/** Mirrors backend/src/modules/catalog/catalog.types.ts (public fields only). */

export type ServiceSort = "popular" | "rating" | "price-asc" | "price-desc" | "newest" | "relevance";
export type AvailabilityFilter = "today" | "tomorrow";
export type ServiceAvailability = AvailabilityFilter | "scheduled";

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  /** Active services in this category. */
  serviceCount: number;
}

export interface CatalogService {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: { id: string; name: string; slug: string };
  basePrice: number;
  durationMinutes: number;
  rating: number;
  ratingCount: number;
  availability: ServiceAvailability;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServicePage {
  items: CatalogService[];
  meta: PageMeta;
}

/** Everything GET /services accepts. Undefined keys are simply not sent. */
export interface ServiceListParams {
  q?: string;
  category?: string; // category slug (the API also accepts an id)
  rating?: number;
  minPrice?: number;
  maxPrice?: number;
  duration?: number; // longest acceptable, in minutes
  availability?: AvailabilityFilter;
  sort?: ServiceSort;
  page: number;
  limit: number;
}
