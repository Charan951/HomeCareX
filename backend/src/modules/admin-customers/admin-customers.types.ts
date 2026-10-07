export type CustomerStatus = 'active' | 'blocked';

/** One row of the admin customers table. */
export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  /** All bookings the customer has ever made, whatever their status. */
  bookingsCount: number;
  /** Lifetime value in INR: sum of booking totals whose paymentStatus is PAID (refunded/failed/pending excluded). */
  ltv: number;
  /** Latest of last login and last booking. Null if the customer never logged in or booked. */
  lastActivityAt: Date | null;
  createdAt: Date;
}

export interface AdminCustomersPage {
  items: AdminCustomerRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* ---------------- GET /admin/customers/:id ---------------- */

export interface CustomerOverview {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  createdAt: Date;
  lastLoginAt: Date | null;
  lastActivityAt: Date | null;
  /** The most recent block/unblock decision, so the header can say who did it and why. */
  statusChange: { status: CustomerStatus; reason: string | null; by: string | null; at: Date } | null;
  stats: {
    bookingsCount: number;
    completedCount: number;
    cancelledCount: number;
    /** INR, PAID bookings only (same definition as the list). */
    ltv: number;
    openTickets: number;
    reviewsCount: number;
  };
}

export interface CustomerBookingItem {
  id: string;
  serviceName: string;
  status: string;
  paymentStatus: string;
  total: number;
  scheduledAt: Date | null;
  createdAt: Date;
}

export interface CustomerAddressItem {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface CustomerPaymentItem {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: string | null;
  status: string;
  refundStatus: string;
  paidAt: Date | null;
  createdAt: Date;
}

export interface CustomerActivityItem {
  id: string;
  action: string;
  actor: string | null;
  reason: string | null;
  at: Date;
}

export interface CustomerTicketItem {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  lastMessageAt: Date;
  createdAt: Date;
}

export interface CustomerReviewItem {
  id: string;
  rating: number;
  message: string;
  status: string;
  createdAt: Date;
}

export interface AdminCustomerDetail {
  overview: CustomerOverview;
  bookings: CustomerBookingItem[];
  addresses: CustomerAddressItem[];
  payments: CustomerPaymentItem[];
  activity: CustomerActivityItem[];
  support: CustomerTicketItem[];
  reviews: CustomerReviewItem[];
}

/** PATCH /admin/customers/:id/status response. */
export interface CustomerStatusResult {
  id: string;
  status: CustomerStatus;
  previousStatus: CustomerStatus;
  /** True when sessions were revoked (blocking only). */
  sessionsRevoked: boolean;
}
