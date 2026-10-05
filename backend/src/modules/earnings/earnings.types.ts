import type { EarningStatus } from './earnings.constants';

/**
 * Earning contract. One row per completed booking. Amounts are INR rounded to 2 decimals.
 * Invariant: net = gross - commission, commission = round2(gross * commissionRate).
 */
export interface EarningDto {
  id: string;
  bookingId: string;
  /** Partner._id */
  partnerId: string;
  gross: number;
  /** Fraction applied when the earning was created (0.2 = 20%). Frozen; later Settings changes don't rewrite it. */
  commissionRate: number;
  commission: number;
  net: number;
  status: EarningStatus;
  /** When the job was completed. Drives today / week / month buckets. */
  earnedAt: string;
  settledAt: string | null;
}

/** GET /partner/earnings/summary. All figures are the partner's NET share in INR, never null. */
export interface EarningsSummaryDto {
  currency: 'INR';
  today: number;
  week: number;
  month: number;
  /** Everything ever earned, pending + settled. */
  total: number;
  /** Earned but not yet paid out (status = pending). */
  pending: number;
}

/** One ledger line: the earning plus the service it came from (null if the booking is gone). */
export interface LedgerRowDto extends EarningDto {
  serviceName: string | null;
}

export interface LedgerTotalsDto {
  count: number;
  gross: number;
  commission: number;
  net: number;
}

/** Net earned on one business day ("YYYY-MM-DD", business timezone). Days with no earnings are filled with 0. */
export interface LedgerDayDto {
  date: string;
  net: number;
}

/** GET /partner/earnings. `totals` and `series` cover the whole filter, not just the current page. */
export interface EarningsLedgerDto {
  currency: 'INR';
  items: LedgerRowDto[];
  totals: LedgerTotalsDto;
  series: LedgerDayDto[];
  pagination: { page: number; limit: number; total: number; pages: number };
}