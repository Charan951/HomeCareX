import { ACTIVE_JOB_STATUSES, type BookingStatus } from '../bookings/bookings.constants';

/** Partner is on the way / on the job: shown in "Active bookings". */
export const DASHBOARD_LIVE_STATUSES: BookingStatus[] = ACTIVE_JOB_STATUSES;

/** Booked but not started yet: shown in "Upcoming". */
export const DASHBOARD_UPCOMING_STATUSES: BookingStatus[] = ['created', 'searching_for_partner', 'assigned'];

export const MAX_BOOKINGS_PER_SECTION = 5;
export const MAX_CATEGORIES = 8;
export const MAX_RECOMMENDED_SERVICES = 5;

/** Which of the 4 progress bars are filled for a live booking. */
export const LIVE_PROGRESS_STEP: Partial<Record<BookingStatus, number>> = {
  en_route: 2,
  arrived: 3,
  in_progress: 4,
};
