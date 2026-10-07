export type CustomerStatus = 'active' | 'blocked';

/** Must match CUSTOMER_SORT_FIELDS in backend/src/modules/admin-customers. */
export type CustomerSortKey = 'name' | 'email' | 'status' | 'bookingsCount' | 'ltv' | 'lastActivityAt' | 'createdAt';

export interface AdminCustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  bookingsCount: number;
  /** INR, PAID bookings only. */
  ltv: number;
  /** ISO date, or null if the customer never logged in or booked. */
  lastActivityAt: string | null;
  createdAt: string;
}

export interface AdminCustomersPage {
  items: AdminCustomerRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerListParams {
  search: string;
  /** '' = all */
  status: '' | CustomerStatus;
  /** Omit for the server default (newest first). */
  sortBy?: CustomerSortKey;
  sortDir?: 'asc' | 'desc';
  page: number;
  limit: number;
}

/* ---------------- GET /admin/customers/:id (mirrors backend admin-customers.types.ts) ---------------- */

export interface CustomerOverview {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: CustomerStatus;
  createdAt: string;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  /** Latest block/unblock decision. */
  statusChange: { status: CustomerStatus; reason: string | null; by: string | null; at: string } | null;
  stats: {
    bookingsCount: number;
    completedCount: number;
    cancelledCount: number;
    /** INR, PAID bookings only. */
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
  scheduledAt: string | null;
  createdAt: string;
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
  paidAt: string | null;
  createdAt: string;
}

export interface CustomerActivityItem {
  id: string;
  action: string;
  actor: string | null;
  reason: string | null;
  at: string;
}

export interface CustomerTicketItem {
  id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  lastMessageAt: string;
  createdAt: string;
}

export interface CustomerReviewItem {
  id: string;
  rating: number;
  message: string;
  status: string;
  createdAt: string;
}

/** Each tab list is capped server-side at 50 (newest first); overview.stats has the true totals. */
export interface AdminCustomerDetail {
  overview: CustomerOverview;
  bookings: CustomerBookingItem[];
  addresses: CustomerAddressItem[];
  payments: CustomerPaymentItem[];
  activity: CustomerActivityItem[];
  support: CustomerTicketItem[];
  reviews: CustomerReviewItem[];
}

export interface UpdateCustomerStatusInput {
  status: CustomerStatus;
  reason: string;
}

export interface UpdateCustomerInput {
  name: string;
  email: string;
  /** Empty string clears the phone. */
  phone: string;
}

export interface CustomerStatusResult {
  id: string;
  status: CustomerStatus;
  previousStatus: CustomerStatus;
  sessionsRevoked: boolean;
}
