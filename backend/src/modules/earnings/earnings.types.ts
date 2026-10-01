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