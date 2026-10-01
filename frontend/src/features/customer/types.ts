/**
 * Response contract for GET /api/v1/customer/dashboard.
 * Mirrors backend/src/modules/customer-dashboard/customer-dashboard.types.ts —
 * keep the two in sync when the backend DTO changes.
 */

export type BookingStatusDto =
  | "created"
  | "searching_for_partner"
  | "assigned"
  | "en_route"
  | "arrived"
  | "in_progress"
  | "completed"
  | "rated"
  | "cancelled_by_customer"
  | "cancelled_by_partner"
  | "no_show"
  | "disputed";

export interface AddressDto {
  id: string;
  label: string;
  line1: string;
  area: string | null;
  city: string;
  pincode: string | null;
  isDefault: boolean;
}

/** Body of POST /customer/addresses. */
export interface AddressInput {
  label: string;
  line1: string;
  area?: string | null;
  city: string;
  pincode?: string | null;
  /** Make it the address shown on the dashboard. */
  isDefault?: boolean;
}

/** Body of PATCH /customer/addresses/:id (any subset; null clears area / pincode). */
export type AddressPatch = Partial<Omit<AddressInput, "isDefault">> & { isDefault?: true };

export interface DashboardBookingDto {
  id: string;
  serviceName: string;
  status: BookingStatusDto;
  /** ISO date-time. */
  scheduledAt: string;
  /** "Ramesh K." — null until a partner is assigned. */
  partnerName: string | null;
  /** 0–4: number of filled progress bars. */
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

export interface CustomerDashboardDto {
  greeting: { name: string; firstName: string };
  /** True when the customer has never booked → show the welcome state. */
  isNewCustomer: boolean;
  defaultAddress: AddressDto | null;
  activeBookings: DashboardBookingDto[];
  upcomingBookings: DashboardBookingDto[];
  categories: DashboardCategoryDto[];
  recommendedServices: DashboardServiceDto[];
  unreadNotifications: number;
}
