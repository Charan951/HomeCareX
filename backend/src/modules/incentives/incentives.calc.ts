import type { IncentiveStatus } from './incentives.constants';
import type { IncentiveDto } from './incentives.types';

const DAY_MS = 86_400_000;

/** A campaign as stored (ids as strings, dates as Date). */
export interface CampaignRecord {
  id: string;
  title: string;
  description: string;
  targetJobs: number;
  rewardAmount: number;
  startsAt: Date;
  endsAt: Date;
  minRating: number | null;
  categoryIds: string[];
}

/** One completed job. categoryId is null when the booking has none. */
export interface CompletedJob {
  completedAt: Date;
  categoryId: string | null;
}

export interface PartnerFacts {
  ratingAvg: number;
  ratingCount: number;
}

const fmtDate = (d: Date): string =>
  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

/** Jobs that count toward a campaign: completed inside [startsAt, endsAt) and in an allowed category. Oldest first. */
export function countingJobs(c: CampaignRecord, jobs: CompletedJob[]): CompletedJob[] {
  const from = c.startsAt.getTime();
  const to = c.endsAt.getTime();
  return jobs
    .filter((j) => {
      const t = j.completedAt.getTime();
      if (t < from || t >= to) return false;
      return c.categoryIds.length === 0 || (j.categoryId !== null && c.categoryIds.includes(j.categoryId));
    })
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
}

export function checkEligibility(c: CampaignRecord, partner: PartnerFacts): { eligible: boolean; reason: string | null } {
  if (c.minRating !== null && partner.ratingAvg < c.minRating) {
    const yours = partner.ratingCount > 0 ? `yours is ${partner.ratingAvg.toFixed(1)}` : 'you have no ratings yet';
    return { eligible: false, reason: `Needs an average rating of ${c.minRating.toFixed(1)} or more (${yours}).` };
  }
  return { eligible: true, reason: null };
}

/**
 * upcoming  now is before the window opens
 * completed target reached inside the window by an eligible partner
 * expired   window is over and the target was not reached (or the partner was not eligible)
 * active    otherwise
 */
export function campaignStatus(now: Date, c: CampaignRecord, counted: number, eligible: boolean): IncentiveStatus {
  if (now.getTime() < c.startsAt.getTime()) return 'upcoming';
  if (eligible && counted >= c.targetJobs) return 'completed';
  if (now.getTime() >= c.endsAt.getTime()) return 'expired';
  return 'active';
}

const rulesFor = (c: CampaignRecord): string[] => {
  const rules = [`Complete ${c.targetJobs} ${c.targetJobs === 1 ? 'job' : 'jobs'} between ${fmtDate(c.startsAt)} and ${fmtDate(new Date(c.endsAt.getTime() - 1))}.`];
  if (c.categoryIds.length > 0) rules.push('Only jobs in the campaign’s service categories count.');
  if (c.minRating !== null) rules.push(`Keep an average rating of ${c.minRating.toFixed(1)} or more.`);
  rules.push('Only completed jobs count. Cancelled jobs and no-shows do not.');
  return rules;
};

export function buildIncentive(now: Date, c: CampaignRecord, jobs: CompletedJob[], partner: PartnerFacts): IncentiveDto {
  const counted = countingJobs(c, jobs);
  const completedJobs = counted.length;
  const { eligible, reason } = checkEligibility(c, partner);
  const status = campaignStatus(now, c, completedJobs, eligible);

  return {
    id: c.id,
    title: c.title,
    description: c.description,
    status,
    targetJobs: c.targetJobs,
    completedJobs,
    remainingJobs: Math.max(0, c.targetJobs - completedJobs),
    percent: Math.min(100, Math.floor((completedJobs / c.targetJobs) * 100)),
    currency: 'INR',
    rewardAmount: c.rewardAmount,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
    daysLeft: status === 'active' ? Math.max(0, Math.ceil((c.endsAt.getTime() - now.getTime()) / DAY_MS)) : null,
    startsInDays: status === 'upcoming' ? Math.max(0, Math.ceil((c.startsAt.getTime() - now.getTime()) / DAY_MS)) : null,
    minRating: c.minRating,
    eligible,
    ineligibleReason: reason,
    achievedAt: status === 'completed' ? counted[c.targetJobs - 1].completedAt.toISOString() : null,
    rules: rulesFor(c),
  };
}