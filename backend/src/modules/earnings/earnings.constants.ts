export const EARNING_STATUSES = ['pending', 'settled'] as const;
export type EarningStatus = (typeof EARNING_STATUSES)[number];

/** Used only when no Settings document exists yet. Override with DEFAULT_COMMISSION_RATE (e.g. 0.15). */
export const FALLBACK_COMMISSION_RATE = 0.2;