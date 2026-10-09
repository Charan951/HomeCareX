/** Mirrors the backend booking statuses (backend/src/modules/bookings/bookings.constants.ts). */
export type JobStatus =
  | 'pending_payment'
  | 'confirmed'
  | 'created'
  | 'searching_for_partner'
  | 'assigned'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'rated'
  | 'cancelled_by_customer'
  | 'cancelled_by_partner'
  | 'cancelled_by_admin'
  | 'no_show'
  | 'disputed';

/** A button the server says the partner may press right now (GET /partner/jobs/:id -> actions). */
export interface JobAction {
  status: 'en_route' | 'arrived';
  label: string;
}

/** Lifecycle shown in the progress strip. Cancelled / no-show / disputed sit outside it. */
export const LIFECYCLE: readonly JobStatus[] = [
  'assigned',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
];

export const STATUS_LABEL: Record<JobStatus, string> = {
  pending_payment: 'Pending payment',
  confirmed: 'Confirmed',
  created: 'Created',
  searching_for_partner: 'Finding a partner',
  assigned: 'Assigned',
  en_route: 'On the way',
  arrived: 'Arrived',
  in_progress: 'In progress',
  completed: 'Completed',
  rated: 'Rated',
  cancelled_by_customer: 'Cancelled by customer',
  cancelled_by_partner: 'Cancelled by you',
  cancelled_by_admin: 'Cancelled by admin',
  no_show: 'No show',
  disputed: 'Disputed',
};

export const isCancelled = (status: JobStatus): boolean => status.startsWith('cancelled');
export const isFinished = (status: JobStatus): boolean => status === 'completed' || status === 'rated';