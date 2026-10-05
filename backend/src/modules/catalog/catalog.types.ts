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

export interface PublicServiceDetailDto extends PublicServiceDto {
  addOns: { id: string; name: string; price: number }[];
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
