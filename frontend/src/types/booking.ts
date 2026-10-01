/** Mirror of backend/src/modules/bookings/bookings.constants.ts (BOOKING_STATUSES). Keep in sync. */
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

/** Named access to the statuses used by the customer booking flow. */
export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  SEARCHING_FOR_PARTNER: 'searching_for_partner',
  ASSIGNED: 'assigned',
  EN_ROUTE: 'en_route',
  ARRIVED: 'arrived',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  RATED: 'rated',
  CANCELLED_BY_CUSTOMER: 'cancelled_by_customer',
} as const satisfies Record<string, BookingStatus>;

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

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
  location?: { lat: number; lng: number };
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
  otp?: { code: string; verifiedAt?: string };
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

export interface CreateBookingRequest {
  serviceId: string;
  quantity: number;
  addOns: BookingAddOnInput[];
  addressId?: string;
  newAddress?: Omit<AddressSnapshot, 'sourceAddressId'>;
  date: string;
  slot: string;
  couponCode?: string;
  expectedTotal?: number;
}

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

export type BookingErrorCode = (typeof BOOKING_ERROR)[keyof typeof BOOKING_ERROR];

export interface ApiErrorBody {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}