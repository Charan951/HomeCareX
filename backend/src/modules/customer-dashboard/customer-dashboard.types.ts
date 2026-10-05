import type { AddressView } from '../addresses/addresses.types';
import type { BookingStatus } from '../bookings/bookings.constants';

export interface DashboardBookingDto {
  id: string;
  serviceName: string;
  status: BookingStatus;
  scheduledAt: string;
  /** "Ramesh K." — first name + last initial only. Null until a partner is assigned. */
  partnerName: string | null;
  /** 0-4: number of filled progress bars. */
  progressStep: number;
  address: { line1: string; area: string | null; city: string };
  total: number;
}

export interface DashboardCategoryDto {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  serviceCount: number;
}

export interface DashboardServiceDto {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  icon: string | null;
  price: number;
  durationMinutes: number;
  rating: number;
  ratingCount: number;
}

/** GET /customer/dashboard → data */
export interface CustomerDashboardDto {
  greeting: { name: string; firstName: string };
  /** True when the customer has never made a booking → show the welcome state. */
  isNewCustomer: boolean;
  defaultAddress: AddressView | null;
  activeBookings: DashboardBookingDto[];
  upcomingBookings: DashboardBookingDto[];
  categories: DashboardCategoryDto[];
  recommendedServices: DashboardServiceDto[];
  unreadNotifications: number;
}

/* ---- raw shapes returned by the repository's aggregations ---- */
export interface BookingRow {
  _id: { toString(): string };
  serviceName: string;
  status: BookingStatus;
  scheduledAt: Date;
  partnerName?: string | null;
  address: { line1: string; area?: string | null; city: string };
  priceBreakdown?: { total?: number | null } | null;
}

export interface BookingsFacet {
  active: BookingRow[];
  upcoming: BookingRow[];
  total: number;
}

export interface CategoryRow {
  _id: { toString(): string };
  name: string;
  slug: string;
  icon?: string | null;
  serviceCount: number;
}

export interface ServiceRow {
  _id: { toString(): string };
  name: string;
  slug: string;
  categoryId: { toString(): string };
  icon?: string | null;
  basePrice: number;
  durationMinutes: number;
  ratingAvg?: number | null;
  ratingCount?: number | null;
}

