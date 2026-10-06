import { ERROR_CODES } from '../../constants/errorCodes';
import { Errors } from '../../utils/errors';
import { buildIncentive, type CampaignRecord, type CompletedJob } from './incentives.calc';
import { incentivesRepository, type IncentivesRepository } from './incentives.repository';
import type { IncentiveDto, IncentivesListDto } from './incentives.types';

const requirePartner = async (userId: string, repo: IncentivesRepository) => {
  const partner = await repo.findPartnerByUserId(userId);
  if (!partner) throw Errors.notFound(ERROR_CODES.PARTNER_NOT_FOUND, 'No partner profile found for this account');
  return partner;
};

const byTime = (get: (i: IncentiveDto) => string, dir: 1 | -1) => (a: IncentiveDto, b: IncentiveDto) =>
  dir * (new Date(get(a)).getTime() - new Date(get(b)).getTime());

/** Earliest start and latest end across the campaigns, so one bookings query covers all of them. */
const spanOf = (campaigns: CampaignRecord[]): { from: Date; to: Date } => ({
  from: new Date(Math.min(...campaigns.map((c) => c.startsAt.getTime()))),
  to: new Date(Math.max(...campaigns.map((c) => c.endsAt.getTime()))),
});

export const incentivesService = {
  /**
   * GET /partner/incentives. Progress is counted from the partner's completed jobs every time, so a job
   * that completes is reflected on the very next request. Nothing is stored per partner.
   */
  async list(
    userId: string,
    now: Date = new Date(),
    repo: IncentivesRepository = incentivesRepository,
  ): Promise<IncentivesListDto> {
    const partner = await requirePartner(userId, repo);
    const campaigns = await repo.listCampaigns(now);
    let jobs: CompletedJob[] = [];
    if (campaigns.length) {
      const { from, to } = spanOf(campaigns);
      jobs = await repo.listCompletedJobs(partner.id, from, to);
    }
    const all = campaigns.map((c) => buildIncentive(now, c, jobs, partner));

    const active = all.filter((i) => i.status === 'active').sort(byTime((i) => i.endsAt, 1));
    const upcoming = all.filter((i) => i.status === 'upcoming').sort(byTime((i) => i.startsAt, 1));
    const completed = all.filter((i) => i.status === 'completed').sort(byTime((i) => i.achievedAt ?? i.endsAt, -1));
    const expired = all.filter((i) => i.status === 'expired').sort(byTime((i) => i.endsAt, -1));

    return {
      currency: 'INR',
      active,
      upcoming,
      completed,
      expired,
      summary: {
        activeCount: active.length,
        upcomingCount: upcoming.length,
        completedCount: completed.length,
        rewardEarned: completed.reduce((sum, i) => sum + i.rewardAmount, 0),
      },
    };
  },

  /** GET /partner/incentives/:id. A campaign that does not exist or is switched off is a 404. */
  async get(
    userId: string,
    id: string,
    now: Date = new Date(),
    repo: IncentivesRepository = incentivesRepository,
  ): Promise<IncentiveDto> {
    const partner = await requirePartner(userId, repo);
    const campaign = await repo.findCampaign(id);
    if (!campaign) throw Errors.notFound(ERROR_CODES.NOT_FOUND, 'Incentive not found');
    const jobs = await repo.listCompletedJobs(partner.id, campaign.startsAt, campaign.endsAt);
    return buildIncentive(now, campaign, jobs, partner);
  },
};