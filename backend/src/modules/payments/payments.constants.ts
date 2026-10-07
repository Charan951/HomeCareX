export const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet', 'cod'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Order creations / reuses allowed per booking before the customer must start a new booking. */
export const PAYMENT_MAX_ATTEMPTS = 5;

/** Razorpay webhook events this module acts on. Anything else is acknowledged and ignored. */
export const WEBHOOK_EVENTS = {
  PAYMENT_CAPTURED: 'payment.captured',
  ORDER_PAID: 'order.paid',
  PAYMENT_FAILED: 'payment.failed',
} as const;

export const WEBHOOK_SIGNATURE_HEADER = 'x-razorpay-signature';
export const WEBHOOK_EVENT_ID_HEADER = 'x-razorpay-event-id';

/** Cash-on-service orders have no Razorpay order; the unique orderId slot gets a synthetic key. */
export const codOrderId = (bookingId: string): string => `cod_${bookingId}`;

/**
 * Booking statuses in which a Cash-on-Service booking (CONFIRMED or later, payment still PENDING) may switch to
 * paying online from My Bookings. Terminal states (completed, cancelled, no_show...) can no longer be paid.
 */
export const COD_ONLINE_PAYABLE_STATUSES: readonly string[] = [
  'confirmed',
  'created',
  'searching_for_partner',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
];

export const isCodOnlinePayableStatus = (status: string): boolean => COD_ONLINE_PAYABLE_STATUSES.includes(status);

export const PAYMENTS_CONSTANTS = { PAYMENT_METHODS, PAYMENT_MAX_ATTEMPTS };