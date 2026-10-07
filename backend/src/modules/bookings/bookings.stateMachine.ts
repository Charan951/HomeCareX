import { ERROR_CODES } from '../../constants/errorCodes';
import { httpError } from '../../utils/errors';
import type {
  ActorRole,
  BookingStatus,
} from './bookings.constants';

/**
 * Transition table:
 * from -> to -> roles allowed to trigger it.
 *
 * Admin is allowed on controlled booking lifecycle transitions so that
 * the Admin Status Override and Cancel Booking features can work while
 * still going through the state machine.
 *
 * A transition that is not listed here remains invalid.
 */
export const TRANSITIONS: Record<
  BookingStatus,
  Partial<Record<BookingStatus, ActorRole[]>>
> = {
  // Customer checkout:
  // payment hold -> confirmed -> matching.
  pending_payment: {
    confirmed: ['system'],
    cancelled_by_customer: [
      'customer',
      'admin',
      'system',
    ],
    cancelled_by_admin: ['admin'],
  },

  confirmed: {
    searching_for_partner: ['system'],
    cancelled_by_customer: [
      'customer',
      'admin',
    ],
    cancelled_by_admin: ['admin'],
  },

  created: {
    searching_for_partner: ['system'],
    cancelled_by_customer: [
      'customer',
      'admin',
    ],
    cancelled_by_admin: ['admin'],
  },

  searching_for_partner: {
    assigned: [
      'partner',
      'admin',
    ],
    cancelled_by_customer: [
      'customer',
      'admin',
    ],
    cancelled_by_admin: ['admin'],
  },

  assigned: {
    en_route: [
      'partner',
      'admin',
    ],
    cancelled_by_customer: [
      'customer',
      'admin',
    ],
    cancelled_by_partner: [
      'partner',
      'admin',
    ],
    cancelled_by_admin: ['admin'],
  },

  en_route: {
    arrived: [
      'partner',
      'admin',
    ],
    cancelled_by_customer: [
      'customer',
      'admin',
    ],
    cancelled_by_partner: [
      'partner',
      'admin',
    ],
    cancelled_by_admin: ['admin'],
  },

  arrived: {
    in_progress: [
      'partner',
      'admin',
    ],
    no_show: [
      'partner',
      'admin',
    ],
    cancelled_by_customer: [
      'customer',
      'admin',
    ],
    cancelled_by_partner: [
      'partner',
      'admin',
    ],
    cancelled_by_admin: ['admin'],
  },

  in_progress: {
    completed: [
      'partner',
      'admin',
    ],
    disputed: [
      'customer',
      'partner',
      'admin',
    ],
    cancelled_by_customer: ['admin'],
    cancelled_by_admin: ['admin'],
  },

  completed: {
    rated: [
      'customer',
      'admin',
    ],
    disputed: [
      'customer',
      'partner',
      'admin',
    ],
    cancelled_by_customer: ['admin'],
    cancelled_by_admin: ['admin'],
  },

  rated: {
    disputed: [
      'customer',
      'admin',
    ],
    cancelled_by_customer: ['admin'],
    cancelled_by_admin: ['admin'],
  },

  cancelled_by_partner: {
    searching_for_partner: [
      'system',
      'admin',
    ],
    cancelled_by_admin: ['admin'],
  },

  no_show: {
    searching_for_partner: ['admin'],
    cancelled_by_customer: ['admin'],
    cancelled_by_admin: ['admin'],
    disputed: ['admin'],
  },

  cancelled_by_customer: {},

  cancelled_by_admin: {},

  disputed: {},
};

export interface StatusHistoryEntry {
  from: BookingStatus | null;
  to: BookingStatus;
  at: Date;
  actorId?: string;
  actorRole: ActorRole;
  reason?: string;
}

/**
 * Returns the statuses that can be reached from the current status.
 */
export const allowedNextStatuses = (
  from: BookingStatus,
): BookingStatus[] =>
  Object.keys(
    TRANSITIONS[from],
  ) as BookingStatus[];

/**
 * Returns true when the status has no valid next transition.
 */
export const isTerminal = (
  status: BookingStatus,
): boolean =>
  allowedNextStatuses(status).length === 0;

/**
 * Checks whether an actor is allowed to perform a transition.
 */
export const canTransition = (
  from: BookingStatus,
  to: BookingStatus,
  actor: ActorRole,
): boolean =>
  TRANSITIONS[from][to]?.includes(actor) ??
  false;

/**
 * Validates a booking status transition.
 *
 * 409 = transition itself is invalid.
 * 403 = transition exists but actor is not allowed.
 */
export function assertTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: ActorRole,
): void {
  const roles = TRANSITIONS[from][to];

  if (!roles) {
    throw httpError(
      409,
      ERROR_CODES.INVALID_STATE_TRANSITION,
      `Cannot move a booking from ${from} to ${to}`,
    );
  }

  if (!roles.includes(actor)) {
    throw httpError(
      403,
      ERROR_CODES.FORBIDDEN,
      `A ${actor} cannot move a booking from ${from} to ${to}`,
    );
  }
}

interface TransitionTarget {
  status: BookingStatus;
  statusHistory: StatusHistoryEntry[];
}

/**
 * Validates the transition, updates booking.status,
 * and appends a status history entry.
 *
 * The caller is responsible for saving the booking.
 */
export function applyTransition(
  booking: TransitionTarget,
  to: BookingStatus,
  actor: {
    role: ActorRole;
    id?: string;
  },
  reason?: string,
  now: Date = new Date(),
): StatusHistoryEntry {
  assertTransition(
    booking.status,
    to,
    actor.role,
  );

  const entry: StatusHistoryEntry = {
    from: booking.status,
    to,
    at: now,
    actorId: actor.id,
    actorRole: actor.role,
    reason,
  };

  booking.status = to;
  booking.statusHistory.push(entry);

  return entry;
}