export const INCENTIVE_STATUSES = ['upcoming', 'active', 'completed', 'expired'] as const;
export type IncentiveStatus = (typeof INCENTIVE_STATUSES)[number];

/** Ended campaigns stay visible (as completed or expired) for this many days, then drop off the list. */
export const HISTORY_DAYS = 90;

/** Most campaigns returned by the list endpoint. */
export const MAX_CAMPAIGNS = 100;

/** Most completed bookings read when counting progress (a safety cap, far above any real target). */
export const MAX_JOBS_READ = 10_000;