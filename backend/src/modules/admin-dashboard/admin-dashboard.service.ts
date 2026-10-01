import type { PipelineStage } from 'mongoose';
import BookingModel from '../../models/Booking';
import CategoryModel from '../../models/Category';
import PartnerModel from '../../models/Partner';
import PaymentModel from '../../models/Payment';
import PayoutModel from '../../models/Payout';
import TicketModel from '../../models/Ticket';
import { COMPLETED_STATUSES } from '../bookings/bookings.constants';
import {
  CANCELLED_STATUSES,
  DAILY_GRANULARITY_MAX_DAYS,
  FUNNEL_STAGES,
  NON_GMV_STATUSES,
  TIMEZONE,
  TOP_CATEGORIES,
} from './admin-dashboard.constants';
import type { DashboardQuery, DashboardSummary, DashboardTrends, Kpi, ResolvedRange, TrendPoint } from './admin-dashboard.types';
import { addDays, parseDashboardQuery, previousRange, resolveRange } from './admin-dashboard.validation';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round1 = (n: number) => Math.round((n + Number.EPSILON) * 10) / 10;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const pctChange = (cur: number, prev: number): number | null => (prev === 0 ? null : round1(((cur - prev) / prev) * 100));
const kpi = (value: number, prev?: number): Kpi => ({ value, delta: prev === undefined ? null : pctChange(value, prev) });

/** Booking filter for a range (by creation time) and an optional city (case-insensitive exact match). */
function bookingMatch(range: ResolvedRange, city?: string) {
  return {
    createdAt: { $gte: range.start, $lte: range.end },
    ...(city ? { 'address.city': { $regex: `^${escapeRegex(city)}$`, $options: 'i' } } : {}),
  };
}

interface Totals {
  bookings: number;
  gmv: number;
  cancelled: number;
  customers: number;
  partners: number;
}

async function totalsFor(range: ResolvedRange, city?: string): Promise<Totals> {
  const [row] = await BookingModel.aggregate<{
    bookings: number; gmv: number; cancelled: number; customers: number; partners: number;
  }>([
    { $match: bookingMatch(range, city) },
    {
      $group: {
        _id: null,
        bookings: { $sum: 1 },
        gmv: { $sum: { $cond: [{ $in: ['$status', NON_GMV_STATUSES] }, 0, { $ifNull: ['$priceBreakdown.total', 0] }] } },
        cancelled: { $sum: { $cond: [{ $in: ['$status', CANCELLED_STATUSES] }, 1, 0] } },
        customers: { $addToSet: '$customerId' },
        partners: { $addToSet: { $cond: [{ $ifNull: ['$partnerId', false] }, '$partnerId', '$$REMOVE'] } },
      },
    },
    {
      $project: {
        _id: 0, bookings: 1, gmv: 1, cancelled: 1,
        customers: { $size: '$customers' },
        partners: { $size: '$partners' },
      },
    },
  ]);
  return row ?? { bookings: 0, gmv: 0, cancelled: 0, customers: 0, partners: 0 };
}

const rate = (t: Totals) => (t.bookings === 0 ? 0 : round1((t.cancelled / t.bookings) * 100));

async function backlog(model: typeof PayoutModel | typeof PaymentModel, match: object, amountField: string) {
  const [row] = await (model as typeof PayoutModel).aggregate<{ count: number; amount: number }>([
    { $match: match },
    { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: { $ifNull: [`$${amountField}`, 0] } } } },
  ]);
  return { count: row?.count ?? 0, amount: round2(row?.amount ?? 0) };
}

async function listCities(): Promise<string[]> {
  const raw = (await BookingModel.distinct('address.city')) as unknown[];
  const seen = new Map<string, string>();
  for (const c of raw) {
    if (typeof c !== 'string' || !c.trim()) continue;
    const name = c.trim();
    if (!seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b)).slice(0, 100);
}

export class AdminDashboardService {
  async summary(rawQuery: unknown): Promise<DashboardSummary> {
    const q: DashboardQuery = parseDashboardQuery(rawQuery);
    const range = resolveRange(q);
    const prev = previousRange(range);

    const [cur, before, activePartnersNow, pendingApprovals, openTickets, payoutBacklog, refundQueue, cities] = await Promise.all([
      totalsFor(range, q.city),
      totalsFor(prev, q.city),
      q.city ? Promise.resolve(0) : PartnerModel.countDocuments({ status: 'active' }),
      PartnerModel.countDocuments({ status: 'pending' }),
      TicketModel.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      backlog(PayoutModel, { status: { $in: ['pending', 'processing', 'failed'] } }, 'amount'),
      backlog(PaymentModel, { 'refund.status': { $in: ['requested', 'approved'] } }, 'refund.amount'),
      listCities(),
    ]);

    return {
      range: { from: range.from, to: range.to, days: range.days, previousFrom: prev.from, previousTo: prev.to },
      city: q.city ?? null,
      kpis: {
        gmv: kpi(round2(cur.gmv), round2(before.gmv)),
        bookings: kpi(cur.bookings, before.bookings),
        activeCustomers: kpi(cur.customers, before.customers),
        activePartners: q.city ? kpi(cur.partners, before.partners) : kpi(activePartnersNow),
        cancellationRate: kpi(rate(cur), rate(before)),
      },
      snapshot: { pendingApprovals, openTickets, payoutBacklog, refundQueue },
      filters: { cities },
    };
  }

  async trends(rawQuery: unknown): Promise<DashboardTrends> {
    const q: DashboardQuery = parseDashboardQuery(rawQuery);
    const range = resolveRange(q);
    const granularity = range.days <= DAILY_GRANULARITY_MAX_DAYS ? 'day' : 'week';
    const match = bookingMatch(range, q.city);

    const bucket = {
      $dateToString: {
        format: '%Y-%m-%d',
        timezone: TIMEZONE,
        date: { $dateTrunc: { date: '$createdAt', unit: granularity, timezone: TIMEZONE, startOfWeek: 'monday' } },
      },
    };
    const isCompleted = { $in: ['$status', COMPLETED_STATUSES as string[]] };
    const reached = (statuses: readonly string[]) => ({
      $cond: [
        {
          $or: [
            { $in: ['$status', statuses as string[]] },
            { $gt: [{ $size: { $setIntersection: [{ $ifNull: ['$statusHistory.to', []] }, statuses as string[]] } }, 0] },
          ],
        },
        1,
        0,
      ],
    });

    const accumulators: Record<string, { $sum: unknown }> = {};
    for (const s of FUNNEL_STAGES) accumulators[s.key] = { $sum: s.statuses ? reached(s.statuses) : 1 };
    const funnelGroup = { _id: null, ...accumulators } as PipelineStage.Group['$group'];

    const categoryPipeline: PipelineStage[] = [
      { $match: match },
      {
        $group: {
          _id: '$categoryId',
          bookings: { $sum: 1 },
          gmv: { $sum: { $cond: [{ $in: ['$status', NON_GMV_STATUSES] }, 0, { $ifNull: ['$priceBreakdown.total', 0] }] } },
        },
      },
      { $sort: { bookings: -1 } },
    ];

    const [seriesRows, categoryRows, [funnelRow]] = await Promise.all([
      BookingModel.aggregate<{ _id: string; bookings: number; gmv: number; revenue: number }>([
        { $match: match },
        {
          $group: {
            _id: bucket,
            bookings: { $sum: 1 },
            gmv: { $sum: { $cond: [{ $in: ['$status', NON_GMV_STATUSES] }, 0, { $ifNull: ['$priceBreakdown.total', 0] }] } },
            revenue: {
              $sum: {
                $cond: [
                  isCompleted,
                  {
                    $max: [
                      0,
                      {
                        $subtract: [
                          { $subtract: [{ $ifNull: ['$priceBreakdown.total', 0] }, { $ifNull: ['$priceBreakdown.tax', 0] }] },
                          { $ifNull: ['$partnerEarning', 0] },
                        ],
                      },
                    ],
                  },
                  0,
                ],
              },
            },
          },
        },
      ]),
      BookingModel.aggregate<{ _id: unknown; bookings: number; gmv: number }>(categoryPipeline),
      BookingModel.aggregate<Record<string, number>>([{ $match: match }, { $group: funnelGroup }]),
    ]);

    // One point per bucket, including empty ones, so the chart x-axis has no gaps.
    const byDate = new Map(seriesRows.map((r) => [r._id, r]));
    const series: TrendPoint[] = [];
    let cursor = range.from;
    if (granularity === 'week') {
      const dow = new Date(`${cursor}T00:00:00Z`).getUTCDay(); // 0 = Sunday
      cursor = addDays(cursor, -((dow + 6) % 7)); // back to Monday
    }
    const step = granularity === 'week' ? 7 : 1;
    for (; cursor <= range.to; cursor = addDays(cursor, step)) {
      const r = byDate.get(cursor);
      series.push({ date: cursor, bookings: r?.bookings ?? 0, gmv: round2(r?.gmv ?? 0), revenue: round2(r?.revenue ?? 0) });
    }

    // Category names, top N + "Other".
    const ids = categoryRows.map((c) => c._id).filter(Boolean);
    const names = new Map((await CategoryModel.find({ _id: { $in: ids } }, 'name').lean()).map((c) => [String(c._id), c.name]));
    const all = categoryRows.map((c) => ({
      categoryId: c._id ? String(c._id) : null,
      name: (c._id ? names.get(String(c._id)) : undefined) || 'Uncategorised',
      bookings: c.bookings,
      gmv: round2(c.gmv),
    }));
    const categories = all.slice(0, TOP_CATEGORIES);
    const rest = all.slice(TOP_CATEGORIES);
    if (rest.length) {
      categories.push({
        categoryId: null,
        name: 'Other',
        bookings: rest.reduce((s, c) => s + c.bookings, 0),
        gmv: round2(rest.reduce((s, c) => s + c.gmv, 0)),
      });
    }

    const requested = funnelRow?.requested ?? 0;
    const funnel = FUNNEL_STAGES.map((s) => {
      const count = funnelRow?.[s.key] ?? 0;
      return { stage: s.key, label: s.label, count, percentOfRequested: requested ? round1((count / requested) * 100) : 0 };
    });

    return {
      range: { from: range.from, to: range.to, days: range.days, granularity },
      city: q.city ?? null,
      series,
      categories,
      funnel,
    };
  }
}

export const adminDashboardService = new AdminDashboardService();
