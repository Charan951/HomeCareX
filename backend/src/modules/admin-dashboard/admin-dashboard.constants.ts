export const MAX_RANGE_DAYS = 365;
export const DEFAULT_PRESET = '30d';
/** All dashboard dates are calendar days in India Standard Time (no DST, fixed +05:30). */
export const TIMEZONE = 'Asia/Kolkata';
export const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
/** Up to this many days the trend charts use one point per day, above it one per week. */
export const DAILY_GRANULARITY_MAX_DAYS = 92;
export const TOP_CATEGORIES = 8;

export const DATE_PRESETS = ['today', '7d', '30d', '90d', 'this_month', 'last_month'] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

export const CANCELLED_STATUSES = ['cancelled_by_customer', 'cancelled_by_partner', 'no_show'] as const;
/** Statuses that never turn into money, excluded from GMV. */
export const NON_GMV_STATUSES = [...CANCELLED_STATUSES] as string[];

/** Funnel stages and the booking statuses that count as having reached each one. */
export const FUNNEL_STAGES = [
  { key: 'requested', label: 'Requested', statuses: null },
  { key: 'assigned', label: 'Partner assigned', statuses: ['assigned', 'en_route', 'arrived', 'in_progress', 'completed', 'rated'] },
  { key: 'started', label: 'Job started', statuses: ['in_progress', 'completed', 'rated'] },
  { key: 'completed', label: 'Completed', statuses: ['completed', 'rated'] },
  { key: 'rated', label: 'Rated', statuses: ['rated'] },
] as const;
