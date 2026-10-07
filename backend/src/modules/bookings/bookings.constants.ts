/**
 * Booking status contract, shared by Customer (R01-R07), Partner (P02-P05) and Admin.
 * Frontend mirror: frontend/src/types/booking.ts. Transitions live in bookings.stateMachine.ts.
 *
 * Customer flow:
 * pending_payment -> confirmed -> searching_for_partner -> assigned
 * -> en_route -> arrived -> in_progress -> completed -> rated
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
  'cancelled_by_admin',
  'no_show',
  'disputed',
] as const;

export type BookingStatus =
  (typeof BOOKING_STATUSES)[number];

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
  CANCELLED_BY_ADMIN: 'cancelled_by_admin',
} as const satisfies Record<string, BookingStatus>;

/** Statuses that hold a slot seat. */
export const SLOT_HOLDING_STATUSES: BookingStatus[] = [
  'pending_payment',
  'confirmed',
  'created',
  'searching_for_partner',
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
];

/** Who triggers a transition. */
export const ACTOR_ROLES = [
  'customer',
  'partner',
  'admin',
  'system',
] as const;

export type ActorRole =
  (typeof ACTOR_ROLES)[number];

/** Partner is physically on a job. */
export const ACTIVE_JOB_STATUSES: BookingStatus[] = [
  'en_route',
  'arrived',
  'in_progress',
];

/** Counts toward today's jobs once assigned. */
export const SCHEDULED_JOB_STATUSES: BookingStatus[] = [
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'rated',
];

export const COMPLETED_STATUSES: BookingStatus[] = [
  'completed',
  'rated',
];

/** Default concurrent bookings one service/date/slot can hold. */
export const SLOT_CAPACITY = 3;

/** Customers may book today + next 13 days. */
export const BOOKING_WINDOW_DAYS = 14;

/** Booking timezone. */
export const BOOKING_TIMEZONE = 'Asia/Kolkata';

/** Pending payment bookings older than this are stale. */
export const BOOKING_HOLD_MS =
  10 * 60 * 1000;

/** Fixed daily slot grid. */
export const SERVICE_SLOTS = [
  '08:00-10:00',
  '10:00-12:00',
  '12:00-14:00',
  '14:00-16:00',
  '16:00-18:00',
  '18:00-20:00',
] as const;

export const CONVENIENCE_FEE = 29;

export interface CatalogAddOn {
  id: string;
  name: string;
  price: number;
}

export interface CatalogService {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  addOns: CatalogAddOn[];
}

const CATALOG: CatalogService[] = [
  {
    id: '650000000000000000000001',
    slug: 'deep-home-cleaning',
    name: 'Deep Home Cleaning',
    basePrice: 1499,
    addOns: [
      {
        id: '650000000000000000000101',
        name: 'Deep Cleaning',
        price: 150,
      },
      {
        id: '650000000000000000000102',
        name: 'Eco-friendly Chemicals',
        price: 50,
      },
      {
        id: '650000000000000000000103',
        name: 'Post-service Sanitization',
        price: 100,
      },
    ],
  },
  {
    id: '650000000000000000000002',
    slug: 'ac-service-gas-refill',
    name: 'AC Service & Gas Refill',
    basePrice: 599,
    addOns: [
      {
        id: '650000000000000000000201',
        name: 'Gas Top-up',
        price: 400,
      },
      {
        id: '650000000000000000000202',
        name: 'Filter Replacement',
        price: 250,
      },
    ],
  },
  {
    id: '650000000000000000000003',
    slug: 'electrician-visit-general',
    name: 'Electrician Visit (General)',
    basePrice: 249,
    addOns: [
      {
        id: '650000000000000000000301',
        name: 'Fixture Installation',
        price: 199,
      },
    ],
  },
  {
    id: '650000000000000000000004',
    slug: 'sofa-carpet-shampooing',
    name: 'Sofa & Carpet Shampooing',
    basePrice: 899,
    addOns: [
      {
        id: '650000000000000000000401',
        name: 'Stain Treatment',
        price: 120,
      },
    ],
  },
  {
    id: '650000000000000000000005',
    slug: 'ro-water-purifier-service',
    name: 'RO/Water Purifier Service',
    basePrice: 399,
    addOns: [
      {
        id: '650000000000000000000501',
        name: 'Filter Change',
        price: 300,
      },
    ],
  },
  {
    id: '650000000000000000000006',
    slug: 'at-home-spa-women',
    name: 'At-Home Spa for Women',
    basePrice: 1299,
    addOns: [
      {
        id: '650000000000000000000601',
        name: 'Aromatherapy Oils',
        price: 200,
      },
    ],
  },
  {
    id: '650000000000000000000007',
    slug: 'room-painting',
    name: 'Room Painting (per room)',
    basePrice: 3499,
    addOns: [
      {
        id: '650000000000000000000701',
        name: 'Wall Putty & Primer',
        price: 800,
      },
    ],
  },
  {
    id: '650000000000000000000008',
    slug: 'general-pest-control',
    name: 'General Pest Control',
    basePrice: 799,
    addOns: [
      {
        id: '650000000000000000000801',
        name: 'Termite Treatment',
        price: 600,
      },
    ],
  },
  {
    id: '650000000000000000000009',
    slug: 'furniture-assembly',
    name: 'Furniture Assembly',
    basePrice: 349,
    addOns: [
      {
        id: '650000000000000000000901',
        name: 'Wall Mounting',
        price: 150,
      },
    ],
  },
];

export const BOOKINGS_SERVICE_CATALOG = {
  getById: (
    id: string,
  ): CatalogService | undefined =>
    CATALOG.find(
      (service) => service.id === id,
    ),

  all: (): CatalogService[] =>
    CATALOG,
};

/** Client/server price difference tolerance. */
export const PRICE_CHANGED_TOLERANCE = 1;

/** Slot lock settings. */
export const BOOKING_LOCK_TTL_MS = 10_000;
export const BOOKING_LOCK_WAIT_MS = 3_000;

export const BOOKINGS_CONSTANTS = {
  SLOT_CAPACITY,
  BOOKING_WINDOW_DAYS,
  BOOKING_TIMEZONE,
  BOOKING_HOLD_MS,
  SERVICE_SLOTS,
  CONVENIENCE_FEE,
};