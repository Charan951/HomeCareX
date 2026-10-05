/** Mirror of backend/src/modules/bookings/bookings.constants.ts (BOOKING_STATUSES).
 * Keep in sync.
 */
export const BOOKING_STATUSES = [
  'pending_payment',
  'confirmed',
  'created',
  'searching_for_partner',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'rated',
  'cancelled_by_customer',
  'cancelled_by_partner',
  'no_show',
  'disputed',
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Named access to all booking statuses across customer, partner, and admin flows. */
export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  CREATED: 'created',
  SEARCHING_FOR_PARTNER: 'searching_for_partner',
  ASSIGNED: 'assigned',
  EN_ROUTE: 'en_route',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  RATED: 'rated',
  CANCELLED_BY_CUSTOMER: 'cancelled_by_customer',
  CANCELLED_BY_PARTNER: 'cancelled_by_partner',
  NO_SHOW: 'no_show',
  DISPUTED: 'disputed',
} as const satisfies Record<string, BookingStatus>;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export interface BookingAddOnInput {
  addOnId: string;
  quantity: number;
}

export interface AddressSnapshot {
  label?: string;
  contactName?: string;
  contactPhone?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location?: {
    lat: number;
    lng: number;
  };
  sourceAddressId?: string;
}

export interface PriceLine {
  kind: 'BASE' | 'ADDON';
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export interface PriceSnapshot {
  currency: 'INR';
  lines: PriceLine[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  convenienceFee: number;

  /** Added by the pricing engine (R02); older snapshots do not have them. */
  surge?: number;
  gst?: number;

  total: number;
  computedAt: string;
}

export interface BookingHistoryEntry {
  from: BookingStatus | null;
  to: BookingStatus;
  at: string;
  actorId?: string;
  actorRole: 'customer' | 'partner' | 'admin' | 'system';
  reason?: string;
}

export interface BookingView {
  _id: string;

  customerId: string;
  serviceId: string;

  quantity: number;
  addOns: BookingAddOnInput[];

  addressSnapshot: AddressSnapshot;

  date: string;
  slot: string;

  priceSnapshot: PriceSnapshot;

  status: BookingStatus;
  paymentStatus: PaymentStatus;

  partnerId?: string;

  otp?: {
    code: string;
    verifiedAt?: string;
  };

  statusHistory: BookingHistoryEntry[];

  holdExpiresAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface SlotAvailability {
  slot: string;
  available: boolean;
  remaining?: number;
}

export interface SlotsResponse {
  serviceId: string;
  date: string;
  slots: SlotAvailability[];
}

export type BaseCreateBookingRequest = {
  serviceId: string;
  quantity: number;
  addOns: BookingAddOnInput[];
  date: string;
  slot: string;
  couponCode?: string;

  /**
   * The total the server quoted and the customer agreed to.
   * Used only to detect a price change.
   * Never used as the amount to charge.
   */
  expectedTotal?: number;
};

/**
 * Either an existing addressId or a newAddress must be provided.
 */
export type CreateBookingRequest = BaseCreateBookingRequest &
  (
    | {
        addressId: string;
        newAddress?: never;
      }
    | {
        addressId?: never;
        newAddress: Omit<AddressSnapshot, 'sourceAddressId'>;
      }
  );

export interface CreateBookingResponse {
  booking: BookingView;
  replayed: boolean;
}

export const BOOKING_ERROR = {
  SLOT_UNAVAILABLE: 'SLOT_UNAVAILABLE',
  ADDRESS_NOT_SERVICEABLE: 'ADDRESS_NOT_SERVICEABLE',
  ADDRESS_NOT_FOUND: 'ADDRESS_NOT_FOUND',
  INVALID_DATE: 'INVALID_DATE',
  PRICE_CHANGED: 'PRICE_CHANGED',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  IDEMPOTENCY_KEY_REUSED: 'IDEMPOTENCY_KEY_REUSED',
  INVALID_TRANSITION: 'INVALID_TRANSITION',
  SERVICE_NOT_FOUND: 'SERVICE_NOT_FOUND',
  BOOKING_NOT_FOUND: 'BOOKING_NOT_FOUND',
} as const;

export type BookingErrorCode =
  (typeof BOOKING_ERROR)[keyof typeof BOOKING_ERROR];

export interface ApiErrorBody {
  success: false;
  message: string;
  code: BookingErrorCode | string;
  details?: unknown;
}

// ============================================================================
// DAY 4 - ADMIN B02 BOOKINGS & OPERATIONS
// Issue #77
// ============================================================================

/**
 * Timeline item displayed inside the Admin Booking Drawer.
 */
export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: string;
  status: string;
  note?: string;
  location?: string;
}

/**
 * Customer information displayed in the admin booking drawer.
 */
export interface BookingDetailCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

/**
 * Partner information displayed in the admin booking drawer.
 */
export interface BookingDetailPartner {
  id: string;
  name: string;
  phone: string;
  rating: number;
  category: string;
  status: string;
}

/**
 * Service information displayed in the admin booking drawer.
 */
export interface BookingDetailService {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
}

/**
 * Pricing information displayed in the admin booking drawer.
 */
export interface BookingDetailPricing {
  basePrice: number;
  tax: number;
  discount: number;
  finalPrice: number;
}

/**
 * Complete booking response used by:
 *
 * GET /admin/bookings/:id
 *
 * This is intentionally separate from BookingView because the admin
 * endpoint returns populated customer, partner, service and timeline
 * information required by the drawer.
 */
export interface BookingDetail {
  id: string;
  bookingNumber: string;

  status: BookingStatus;
  scheduledAt: string;

  totalAmount: number;
  paymentStatus: PaymentStatus;

  customer: BookingDetailCustomer;

  partner?: BookingDetailPartner;

  service: BookingDetailService;

  address: AddressSnapshot;

  pricing: BookingDetailPricing;

  timeline: TimelineEvent[];
}

/**
 * Partner returned by:
 *
 * GET /admin/bookings/:bookingId/eligible-partners
 *
 * The boolean fields allow the AssignPartnerDialog to display
 * eligibility without creating another partner type hierarchy.
 */
export interface PartnerOption {
  id: string;
  name: string;
  category: string;
  serviceArea: string;
  rating: number;

  isApproved: boolean;
  isActive: boolean;
  isAvailable: boolean;
  hasConflict: boolean;

  /**
   * Optional because older backend responses may not provide these fields.
   * When provided, the UI can show the exact eligibility result/reasons.
   */
  eligible?: boolean;
  ineligibleReasons?: string[];
}

/**
 * PATCH /admin/bookings/:bookingId/assign
 */
export interface AssignPartnerRequest {
  partnerId: string;
}

/**
 * PATCH /admin/bookings/:bookingId/status
 */
export interface StatusOverrideRequest {
  status: BookingStatus;
  reason: string;
}

/**
 * POST /admin/bookings/:bookingId/cancel
 */
export interface CancelBookingRequest {
  reason: string;
}

/**
 * Admin booking table filters.
 */
export interface AdminBookingFilters {
  search: string;
  status: BookingStatus | '';
  city: string;
  category: string;
  customer: string;
  partner: string;
  date: string;
  paymentStatus: PaymentStatus | '';
}

/**
 * Response returned by the admin assign endpoint.
 *
 * The backend may return only the assignment result, after which
 * the frontend can call GET /admin/bookings/:id to refresh the
 * complete BookingDetail.
 */
export interface AssignPartnerResponse {
  success: boolean;
  data?: {
    id: string;
    bookingId?: string;
    partnerId: string;
    previousPartnerId?: string | null;
  };
  message?: string;
}

/**
 * Response returned by the status override endpoint.
 */
export interface StatusOverrideResponse {
  success: boolean;
  data?: {
    id: string;
    status: BookingStatus;
    previousStatus: BookingStatus;
    reason: string;
  };
  message?: string;
}

/**
 * Generic admin booking API response wrapper.
 */
export interface AdminBookingDetailResponse {
  success: boolean;
  data: BookingDetail;
}

/**
 * Eligible partners API response.
 */
export interface EligiblePartnersResponse {
  success: boolean;
  data: PartnerOption[];
}