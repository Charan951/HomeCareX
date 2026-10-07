import type { ServiceAvailability } from '../../models/Service';

/** Public category shape: nothing admin-only (no isActive, timestamps). */
export interface PublicCategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  sortOrder: number;
  /** Active services in this category. */
  serviceCount: number;
  /** Lowest base price among its active services (0 if none). */
  fromPrice: number;
  /** True for the single most-booked category; the raw booking numbers stay private. */
  popular: boolean;
}

export interface PublicServiceDto {
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

export interface PublicMediaDto {
  url: string;
  alt: string;
}

export interface PublicFaqDto {
  id: string;
  question: string;
  answer: string;
}

/**
 * Next-7-days slot summary from the bookings slot service. Named `slotAvailability` because
 * `availability` on a service is the older card label (today / tomorrow / scheduled).
 */
export interface SlotAvailabilityDto {
  windowDays: number;
  /** true / false, or null when the slot service could not be reached (the page should not claim "no slots"). */
  hasSlots: boolean | null;
  /** First date (YYYY-MM-DD, Asia/Kolkata) in the window with a free slot; null when none or unknown. */
  nextAvailableDate: string | null;
}

/** GET /services/:slug. The rating summary is `rating` + `ratingCount`; the star distribution comes from GET /services/:id/reviews. */
export interface PublicServiceDetailDto extends PublicServiceDto {
  /** Gallery in display order; the first item is the main image. Empty when none are set. */
  media: PublicMediaDto[];
  inclusions: string[];
  exclusions: string[];
  addOns: { id: string; name: string; price: number }[];
  faqs: PublicFaqDto[];
  slotAvailability: SlotAvailabilityDto;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
