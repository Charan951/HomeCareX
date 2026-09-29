export const BOOKING_STATUSES = [
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

/** Who triggers a transition. 'system' = matching engine / scheduled jobs. */
export const ACTOR_ROLES = ['customer', 'partner', 'admin', 'system'] as const;
export type ActorRole = (typeof ACTOR_ROLES)[number];

/** Partner is physically on a job. */
export const ACTIVE_JOB_STATUSES: BookingStatus[] = ['en_route', 'arrived', 'in_progress'];
/** Counts toward "today's jobs" once assigned. */
export const SCHEDULED_JOB_STATUSES: BookingStatus[] = ['assigned', 'en_route', 'arrived', 'in_progress', 'completed', 'rated'];
export const COMPLETED_STATUSES: BookingStatus[] = ['completed', 'rated'];
