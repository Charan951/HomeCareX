import { Types } from 'mongoose';
import EarningModel from './Earning';
import PartnerModel from '../../models/Partner';
import SettingModel from '../../models/Settings';
import BookingModel from '../../models/Booking';
import { formatOffset } from '../../utils/dates';
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

export interface LedgerFilter {
  /** Inclusive start instant. */
  from?: Date;
  /** Exclusive end instant. */
  to?: Date;
  status?: EarningStatus;
}

export interface LedgerRowRaw {
  id: string;
  bookingId: string;
  partnerId: string;
  gross: number;
  commissionRate: number;
  commission: number;
  net: number;
  status: EarningStatus;
  earnedAt: Date;
  settledAt: Date | null;
  serviceName: string | null;
}

export interface LedgerPageRaw {
  items: LedgerRowRaw[];
  totals: { count: number; gross: number; commission: number; net: number };
  /** One entry per business day that has earnings, "YYYY-MM-DD", ascending. */
  series: { date: string; net: number }[];
}

/** Hard ceiling on a CSV export so one request can't read an unbounded number of rows. */
export const EXPORT_ROW_LIMIT = 10_000;

const buildMatch = (partnerId: string, f: LedgerFilter): Record<string, unknown> => {
  const match: Record<string, unknown> = { partnerId: new Types.ObjectId(partnerId) };
  if (f.from || f.to) {
    match.earnedAt = { ...(f.from ? { $gte: f.from } : {}), ...(f.to ? { $lt: f.to } : {}) };
  }
  if (f.status) match.status = f.status;
  return match;
};

type EarningLean = {
  _id: Types.ObjectId;
  bookingId: Types.ObjectId;
  partnerId: Types.ObjectId;
  gross: number;
  commissionRate: number;
  commission: number;
  net: number;
  status: EarningStatus;
  earnedAt: Date;
  settledAt?: Date | null;
};

/** Adds the service name from Booking in one extra query (not one per row). */
const withServiceNames = async (rows: EarningLean[]): Promise<LedgerRowRaw[]> => {
  const ids = rows.map((r) => r.bookingId);
  const bookings = ids.length
    ? await BookingModel.find({ _id: { $in: ids } }).select('serviceName').lean()
    : [];
  const names = new Map(bookings.map((b) => [String(b._id), b.serviceName as string]));
  return rows.map((r) => ({
    id: String(r._id),
    bookingId: String(r.bookingId),
    partnerId: String(r.partnerId),
    gross: r.gross,
    commissionRate: r.commissionRate,
    commission: r.commission,
    net: r.net,
    status: r.status,
    earnedAt: r.earnedAt,
    settledAt: r.settledAt ?? null,
    serviceName: names.get(String(r.bookingId)) ?? null,
  }));
};

export const earningsRepository = {
  findPartnerIdByUserId: async (userId: string): Promise<string | null> => {
    const partner = await PartnerModel.findOne({ userId }).select('_id').lean();
    return partner ? String(partner._id) : null;
  },

  getCommissionRate: async (): Promise<number | null> => {
    // Admin setting `commission.percent` (e.g. 20) -> fraction (0.2)
    const setting = await SettingModel.findOne({ key: 'commission.percent' }).select('value').lean();
    const percent = Number(setting?.value);
    return setting && Number.isFinite(percent) ? percent / 100 : null;
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

  /**
   * One page of the ledger (newest first) plus totals and a per-day series over the WHOLE filter.
   * The `_id` tie-break keeps paging stable when several earnings share the same earnedAt.
   */
  listLedger: async (
    partnerId: string,
    filter: LedgerFilter,
    page: number,
    limit: number,
    offsetMinutes: number,
  ): Promise<LedgerPageRaw & { total: number }> => {
    const [row] = await EarningModel.aggregate<{
      items: EarningLean[];
      totals: { _id: null; count: number; gross: number; commission: number; net: number }[];
      series: { _id: string; net: number }[];
    }>([
      { $match: buildMatch(partnerId, filter) },
      {
        $facet: {
          items: [{ $sort: { earnedAt: -1, _id: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
          totals: [
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                gross: { $sum: '$gross' },
                commission: { $sum: '$commission' },
                net: { $sum: '$net' },
              },
            },
          ],
          series: [
            {
              $group: {
                _id: { $dateToString: { format: '%Y-%m-%d', date: '$earnedAt', timezone: formatOffset(offsetMinutes) } },
                net: { $sum: '$net' },
              },
            },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]);
    const t = row?.totals?.[0];
    return {
      items: await withServiceNames(row?.items ?? []),
      totals: { count: t?.count ?? 0, gross: t?.gross ?? 0, commission: t?.commission ?? 0, net: t?.net ?? 0 },
      series: (row?.series ?? []).map((d) => ({ date: d._id, net: d.net })),
      total: t?.count ?? 0,
    };
  },

  /** Every matching row for the CSV, newest first, capped at EXPORT_ROW_LIMIT (+1 so the caller can detect truncation). */
  listForExport: async (partnerId: string, filter: LedgerFilter): Promise<LedgerRowRaw[]> => {
    const rows = await EarningModel.find(buildMatch(partnerId, filter))
      .sort({ earnedAt: -1, _id: -1 })
      .limit(EXPORT_ROW_LIMIT + 1)
      .lean<EarningLean[]>();
    return withServiceNames(rows);
  },
};

export type EarningsRepository = typeof earningsRepository;