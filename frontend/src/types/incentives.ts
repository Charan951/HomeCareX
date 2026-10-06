/** Mirrors backend/src/modules/incentives/incentives.types.ts. Keep the two in sync. */
export type IncentiveStatus = "upcoming" | "active" | "completed" | "expired";

export interface Incentive {
  id: string;
  title: string;
  description: string;
  status: IncentiveStatus;
  targetJobs: number;
  /** Jobs this partner completed inside the window that count. Can exceed targetJobs. */
  completedJobs: number;
  remainingJobs: number;
  /** 0-100 */
  percent: number;
  currency: "INR";
  rewardAmount: number;
  startsAt: string;
  endsAt: string;
  /** Only for active campaigns. */
  daysLeft: number | null;
  /** Only for upcoming campaigns. */
  startsInDays: number | null;
  minRating: number | null;
  eligible: boolean;
  ineligibleReason: string | null;
  /** Only for completed campaigns. */
  achievedAt: string | null;
  rules: string[];
}

export interface IncentivesSummary {
  activeCount: number;
  upcomingCount: number;
  completedCount: number;
  rewardEarned: number;
}

/** GET /partner/incentives */
export interface IncentivesList {
  currency: "INR";
  active: Incentive[];
  upcoming: Incentive[];
  completed: Incentive[];
  /** Ended without reaching the target. */
  expired: Incentive[];
  summary: IncentivesSummary;
}