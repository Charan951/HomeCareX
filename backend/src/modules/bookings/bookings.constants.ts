/**
 * Booking contract constants. Frontend mirror: frontend/src/types/booking.ts (BOOKING_STATUS).
 * Keep both in sync — the status enum and its transitions are shared with Partner/Admin modules.
 */

export const BOOKING_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED: 'CONFIRMED',
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  EN_ROUTE: 'EN_ROUTE',
  ARRIVED: 'ARRIVED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];
export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS) as BookingStatus[];

/** Linear happy-path transitions. Any state (except terminal ones) may also transition to CANCELLED. */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  PENDING_PAYMENT: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
  CONFIRMED: [BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.CANCELLED],
  ASSIGNED: [BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.CANCELLED],
  ACCEPTED: [BOOKING_STATUS.EN_ROUTE, BOOKING_STATUS.CANCELLED],
  EN_ROUTE: [BOOKING_STATUS.ARRIVED, BOOKING_STATUS.CANCELLED],
  ARRIVED: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  IN_PROGRESS: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
};

/** Statuses that hold a slot seat (counted against slot capacity / the double-booking guard). */
export const SLOT_HOLDING_STATUSES: BookingStatus[] = [
  BOOKING_STATUS.PENDING_PAYMENT,
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.ASSIGNED,
  BOOKING_STATUS.ACCEPTED,
  BOOKING_STATUS.EN_ROUTE,
  BOOKING_STATUS.ARRIVED,
  BOOKING_STATUS.IN_PROGRESS,
];

export const ACTOR_ROLES = ['customer', 'partner', 'admin', 'system'] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

/** How many concurrent bookings one (service, date, slot) can hold. Real capacity belongs to
 *  a future Service/Partner-availability module; this is the R01 placeholder. */
export const SLOT_CAPACITY = 3;

/** PENDING_PAYMENT bookings older than this are stale and no longer hold their slot seat. */
export const BOOKING_HOLD_MS = 10 * 60 * 1000; // 10 minutes

/** Fixed daily slot grid, "HH:mm-HH:mm". Real availability belongs to a future scheduling module. */
export const SERVICE_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
] as const;

export const CONVENIENCE_FEE = 29;

/**
 * Placeholder service catalog until the Categories/Pricing modules (owned separately) publish a
 * real one. `id` must be a valid Mongo ObjectId string so it round-trips through Category refs.
 * Swap BOOKINGS_SERVICE_CATALOG.get() for a real lookup once that module lands — nothing else
 * in this module needs to change.
 */
export interface CatalogAddOn { id: string; name: string; price: number }
export interface CatalogService { id: string; slug: string; name: string; basePrice: number; addOns: CatalogAddOn[] }

const CATALOG: CatalogService[] = [
  {
    id: '650000000000000000000001',
    slug: 'deep-home-cleaning',
    name: 'Deep Home Cleaning',
    basePrice: 1499,
    addOns: [
      { id: '650000000000000000000101', name: 'Deep Cleaning', price: 150 },
      { id: '650000000000000000000102', name: 'Eco-friendly Chemicals', price: 50 },
      { id: '650000000000000000000103', name: 'Post-service Sanitization', price: 100 },
    ],
  },
  {
    id: '650000000000000000000002',
    slug: 'ac-service-gas-refill',
    name: 'AC Service & Gas Refill',
    basePrice: 599,
    addOns: [
      { id: '650000000000000000000201', name: 'Gas Top-up', price: 400 },
      { id: '650000000000000000000202', name: 'Filter Replacement', price: 250 },
    ],
  },
  {
    id: '650000000000000000000003',
    slug: 'electrician-visit-general',
    name: 'Electrician Visit (General)',
    basePrice: 249,
    addOns: [{ id: '650000000000000000000301', name: 'Fixture Installation', price: 199 }],
  },
];

export const BOOKINGS_SERVICE_CATALOG = {
  getById: (id: string): CatalogService | undefined => CATALOG.find((s) => s.id === id),
  all: (): CatalogService[] => CATALOG,
};

export const BOOKINGS_CONSTANTS = {
  SLOT_CAPACITY,
  BOOKING_HOLD_MS,
  SERVICE_SLOTS,
  CONVENIENCE_FEE,
};