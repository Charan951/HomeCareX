import { ERROR_CODES } from '../../constants/errorCodes';
import { httpError } from '../../utils/errors';
import type { ActorRole, BookingStatus } from './bookings.constants';

/**
 * Transition table: from -> to -> roles allowed to trigger it.
 * Mirrors the TRD lifecycle. A missing entry means the transition is illegal.
 */
export const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, ActorRole[]>>> = {
  // Customer checkout (R01/R03): payment hold -> confirmed -> matching.
  pending_payment: { confirmed: ['system'], cancelled_by_customer: ['customer', 'admin', 'system'] },
  confirmed: { searching_for_partner: ['system'], cancelled_by_customer: ['customer', 'admin'] },
  created: { searching_for_partner: ['system'], cancelled_by_customer: ['customer', 'admin'] },
  searching_for_partner: { assigned: ['partner', 'admin'], cancelled_by_customer: ['customer', 'admin'] },
  assigned: {
    en_route: ['partner'],
    cancelled_by_customer: ['customer', 'admin'],
    cancelled_by_partner: ['partner', 'admin'],
  },
  en_route: {
    arrived: ['partner'],
    cancelled_by_customer: ['customer', 'admin'],
    cancelled_by_partner: ['partner', 'admin'],
  },
  arrived: {
    in_progress: ['partner'],
    no_show: ['partner', 'admin'],
    cancelled_by_customer: ['customer', 'admin'],
    cancelled_by_partner: ['partner', 'admin'],
  },
  in_progress: { completed: ['partner'], disputed: ['customer', 'partner', 'admin'] },
  completed: { rated: ['customer'], disputed: ['customer', 'partner', 'admin'] },
  rated: { disputed: ['customer', 'admin'] },
  cancelled_by_partner: { searching_for_partner: ['system', 'admin'] }, // auto-reassignment
  no_show: { searching_for_partner: ['admin'], cancelled_by_customer: ['admin'], disputed: ['admin'] },
  cancelled_by_customer: {},
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

export const allowedNextStatuses = (from: BookingStatus): BookingStatus[] =>
  Object.keys(TRANSITIONS[from]) as BookingStatus[];

export const isTerminal = (status: BookingStatus): boolean => allowedNextStatuses(status).length === 0;

export const canTransition = (from: BookingStatus, to: BookingStatus, actor: ActorRole): boolean =>
  TRANSITIONS[from][to]?.includes(actor) ?? false;

/** Throws 409 INVALID_STATE_TRANSITION (illegal move) or 403 FORBIDDEN (legal move, wrong actor). */
export function assertTransition(from: BookingStatus, to: BookingStatus, actor: ActorRole): void {
  const roles = TRANSITIONS[from][to];
  if (!roles) {
    throw httpError(409, ERROR_CODES.INVALID_STATE_TRANSITION, `Cannot move a booking from ${from} to ${to}`);
  }
  if (!roles.includes(actor)) {
    throw httpError(403, ERROR_CODES.FORBIDDEN, `A ${actor} cannot move a booking from ${from} to ${to}`);
  }
}

interface TransitionTarget {
  status: BookingStatus;
  statusHistory: StatusHistoryEntry[];
}

/** Validates, then mutates `booking.status` and appends a history entry. Caller saves the document. */
export function applyTransition(
  booking: TransitionTarget,
  to: BookingStatus,
  actor: { role: ActorRole; id?: string },
  reason?: string,
  now: Date = new Date(),
): StatusHistoryEntry {
  assertTransition(booking.status, to, actor.role);
  const entry: StatusHistoryEntry = { from: booking.status, to, at: now, actorId: actor.id, actorRole: actor.role, reason };
  booking.status = to;
  booking.statusHistory.push(entry);
  return entry;
}