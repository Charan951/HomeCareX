import { Types } from 'mongoose';
import BookingModel from '../../models/Booking';
import IncentiveModel from '../../models/Incentive';
import PartnerModel from '../../models/Partner';
import { COMPLETED_STATUSES } from '../bookings/bookings.constants';
import type { CampaignRecord, CompletedJob, PartnerFacts } from './incentives.calc';
import { HISTORY_DAYS, MAX_CAMPAIGNS, MAX_JOBS_READ } from './incentives.constants';

type IncentiveLean = {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  targetJobs: number;
  rewardAmount: number;
  startsAt: Date;
  endsAt: Date;
  minRating?: number | null;
  categoryIds?: Types.ObjectId[];
};

const toRecord = (d: IncentiveLean): CampaignRecord => ({
  id: String(d._id),
  title: d.title,
  description: d.description ?? '',
  targetJobs: d.targetJobs,
  rewardAmount: d.rewardAmount,
  startsAt: d.startsAt,
  endsAt: d.endsAt,
  minRating: d.minRating ?? null,
  categoryIds: (d.categoryIds ?? []).map(String),
});

export const incentivesRepository = {
  /** Partner._id and rating for a signed-in user, or null if the user has no partner profile. */
  findPartnerByUserId: async (userId: string): Promise<({ id: string } & PartnerFacts) | null> => {
    const p = await PartnerModel.findOne({ userId }).select('_id ratingAvg ratingCount').lean();
    return p ? { id: String(p._id), ratingAvg: p.ratingAvg ?? 0, ratingCount: p.ratingCount ?? 0 } : null;
  },

  /** Active-flag campaigns that are upcoming, running, or ended within the last HISTORY_DAYS days. */
  listCampaigns: async (now: Date): Promise<CampaignRecord[]> => {
    const since = new Date(now.getTime() - HISTORY_DAYS * 86_400_000);
    const docs = await IncentiveModel.find({ isActive: true, endsAt: { $gte: since } })
      .sort({ startsAt: -1 })
      .limit(MAX_CAMPAIGNS)
      .lean<IncentiveLean[]>();
    return docs.map(toRecord);
  },

  /** One campaign by id. Inactive (switched off) campaigns are treated as not found. */
  findCampaign: async (id: string): Promise<CampaignRecord | null> => {
    const doc = await IncentiveModel.findOne({ _id: id, isActive: true }).lean<IncentiveLean | null>();
    return doc ? toRecord(doc) : null;
  },

  /** The partner's completed jobs with completedAt in [from, to). One query serves every campaign. */
  listCompletedJobs: async (partnerId: string, from: Date, to: Date): Promise<CompletedJob[]> => {
    const rows = await BookingModel.find({
      partnerId: new Types.ObjectId(partnerId),
      status: { $in: COMPLETED_STATUSES },
      completedAt: { $gte: from, $lt: to },
    })
      .select('completedAt categoryId')
      .limit(MAX_JOBS_READ)
      .lean<{ completedAt: Date; categoryId?: Types.ObjectId | null }[]>();
    return rows.map((r) => ({ completedAt: r.completedAt, categoryId: r.categoryId ? String(r.categoryId) : null }));
  },
};

export type IncentivesRepository = typeof incentivesRepository;