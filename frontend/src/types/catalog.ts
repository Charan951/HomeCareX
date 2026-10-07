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

// ---- Service details page: GET /services/:slug and GET /services/:id/reviews ----

export interface ServiceMedia {
  url: string;
  alt: string;
}

export interface ServiceFaq {
  id: string;
  question: string;
  answer: string;
}

export interface ServiceAddOn {
  id: string;
  name: string;
  price: number;
}

/** Next-7-days slot summary. `hasSlots` is null when the slot service could not be reached. */
export interface SlotAvailability {
  windowDays: number;
  hasSlots: boolean | null;
  /** First date (YYYY-MM-DD, Asia/Kolkata) with a free slot; null when none or unknown. */
  nextAvailableDate: string | null;
}

export interface ServiceDetail extends CatalogService {
  /** Gallery in display order; the first item is the main image. Empty when none are set. */
  media: ServiceMedia[];
  inclusions: string[];
  exclusions: string[];
  addOns: ServiceAddOn[];
  faqs: ServiceFaq[];
  slotAvailability: SlotAvailability;
}

export type StarDistribution = Record<"1" | "2" | "3" | "4" | "5", number>;

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: StarDistribution;
}

export interface ServiceReview {
  id: string;
  rating: number;
  comment: string;
  /** First name + last initial, e.g. "Ravi K." */
  author: string;
  /** True when the review comes from a completed booking of this service. */
  verified: boolean;
  createdAt: string;
}

export interface ServiceReviewsPage {
  summary: ReviewSummary;
  reviews: ServiceReview[];
  meta: PageMeta;
}
