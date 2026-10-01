import { Types } from 'mongoose';
import EarningModel from './Earning';
import PartnerModel from '../../models/Partner';
import { SettingsModel } from '../Settings/Settings';
import type { EarningStatus } from './earnings.constants';

export interface NewEarning {
  partnerId: string;
  bookingId: string;
  gross: number;
  commissionRate: number;
  commission: number;
  net: number;
  earnedAt: Date;
}

export interface SummaryRanges {
  todayStart: Date;
  tomorrowStart: Date;
  weekStart: Date;
  monthStart: Date;
}

export interface SummaryTotals {
  today: number;
  week: number;
  month: number;
  total: number;
  pending: number;
}

export const earningsRepository = {
  findPartnerIdByUserId: async (userId: string): Promise<string | null> => {
    const partner = await PartnerModel.findOne({ userId }).select('_id').lean();
    return partner ? String(partner._id) : null;
  },

  getCommissionRate: async (): Promise<number | null> => {
    const settings = await SettingsModel.findOne({ key: 'platform' }).select('commissionRate').lean();
    return settings ? settings.commissionRate : null;
  },

  /** Plain insert. The unique index on bookingId rejects a duplicate with Mongo error 11000. */
  create: async (data: NewEarning) => {
    const doc = await EarningModel.create({
      ...data,
      partnerId: new Types.ObjectId(data.partnerId),
      bookingId: new Types.ObjectId(data.bookingId),
      status: 'pending' as EarningStatus,
    });
    return doc.toObject();
  },

  /** One aggregation for all five figures. Sums are raw (unrounded); the service rounds. */
  summarize: async (partnerId: string, r: SummaryRanges): Promise<SummaryTotals> => {
    const sumNet = (match: Record<string, unknown>) => [{ $match: match }, { $group: { _id: null, net: { $sum: '$net' } } }];
    const [row] = await EarningModel.aggregate<Record<keyof SummaryTotals, { net: number }[]>>([
      { $match: { partnerId: new Types.ObjectId(partnerId) } },
      {
        $facet: {
          today: sumNet({ earnedAt: { $gte: r.todayStart, $lt: r.tomorrowStart } }),
          week: sumNet({ earnedAt: { $gte: r.weekStart } }),
          month: sumNet({ earnedAt: { $gte: r.monthStart } }),
          total: sumNet({}),
          pending: sumNet({ status: 'pending' }),
        },
      },
    ]);
    const pick = (k: keyof SummaryTotals): number => row?.[k]?.[0]?.net ?? 0;
    return { today: pick('today'), week: pick('week'), month: pick('month'), total: pick('total'), pending: pick('pending') };
  },
};

export type EarningsRepository = typeof earningsRepository;