export const CUSTOMER_STATUSES = ['active', 'blocked'] as const;

/** Columns the table may sort by. Must match the `key` of the sortable columns in the frontend. */
export const CUSTOMER_SORT_FIELDS = ['name', 'email', 'status', 'bookingsCount', 'ltv', 'lastActivityAt', 'createdAt'] as const;
export type CustomerSortField = (typeof CUSTOMER_SORT_FIELDS)[number];

/** Sort fields that only exist after the bookings $lookup. The rest live on the User document. */
export const COMPUTED_SORT_FIELDS: readonly CustomerSortField[] = ['bookingsCount', 'ltv', 'lastActivityAt'];

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const MAX_SEARCH_LENGTH = 100;

/** Booking.paymentStatus value that counts toward LTV. */
export const LTV_PAYMENT_STATUS = 'PAID';

/** Per-tab caps for GET /admin/customers/:id. The overview carries the true totals. */
export const DETAIL_TAB_LIMIT = 50;

export const REASON_MIN_LENGTH = 3;
export const REASON_MAX_LENGTH = 500;

/** AuditLog.entity / action values written by PATCH /admin/customers/:id/status. */
export const AUDIT_ENTITY = 'Customer';
export const AUDIT_ACTION = {
  blocked: 'CUSTOMER_BLOCKED',
  unblocked: 'CUSTOMER_UNBLOCKED',
  updated: 'CUSTOMER_UPDATED',
  deleted: 'CUSTOMER_DELETED',
} as const;

/** Booking statuses the overview counts separately. */
export const COMPLETED_STATUSES = ['completed', 'rated'] as const;
export const CANCELLED_STATUSES = ['cancelled_by_customer', 'cancelled_by_partner'] as const;
