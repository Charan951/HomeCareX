import type { IncentiveStatus } from './incentives.constants';

/** One campaign as the signed-in partner sees it. Dates are ISO strings. */
export interface IncentiveDto {
  id: string;
  title: string;
  description: string;
  status: IncentiveStatus;
  /** Jobs needed to earn the reward. */
  targetJobs: number;
  /** Jobs this partner completed inside the window that count (e.g. 32 of 40). Can exceed targetJobs. */
  completedJobs: number;
  /** targetJobs - completedJobs, never below 0. */
  remainingJobs: number;
  /** completedJobs / targetJobs as a whole number, capped at 100. */
  percent: number;
  currency: 'INR';
  rewardAmount: number;
  startsAt: string;
  endsAt: string;
  /** Whole days left (rounded up). Only for active campaigns, else null. */
  daysLeft: number | null;
  /** Whole days until it starts (rounded up). Only for upcoming campaigns, else null. */
  startsInDays: number | null;
  /** Average rating needed, or null if the campaign has no rating rule. */
  minRating: number | null;
  /** False when the partner does not meet the campaign's rules. Progress still shows, the reward cannot be earned. */
  eligible: boolean;
  /** Why the partner is not eligible, or null. */
  ineligibleReason: string | null;
  /** When the target was reached (the time of the job that hit it). Only for completed campaigns, else null. */
  achievedAt: string | null;
  /** Plain-language rules for the detail screen. */
  rules: string[];
}

export interface IncentivesSummaryDto {
  activeCount: number;
  upcomingCount: number;
  completedCount: number;
  /** Sum of rewardAmount over completed campaigns. */
  rewardEarned: number;
}

/** GET /partner/incentives */
export interface IncentivesListDto {
  currency: 'INR';
  active: IncentiveDto[];
  upcoming: IncentiveDto[];
  completed: IncentiveDto[];
  /** Ended without reaching the target (or without being eligible). */
  expired: IncentiveDto[];
  summary: IncentivesSummaryDto;
}