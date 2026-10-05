import { ERROR_CODES } from '../../constants/errorCodes';
import type { JobCompletedPayload } from '../events/eventBus';
import {
  businessTzOffsetMinutes,
  dayBounds,
  monthStart,
  parseLocalDate,
  toLocalDateString,
  weekStart,
} from '../../utils/dates';
import { Errors } from '../../utils/errors';
import { round2, splitEarning } from './earnings.calc';
import { buildEarningsCsv } from './earnings.csv';
import { FALLBACK_COMMISSION_RATE } from './earnings.constants';
import {
  EXPORT_ROW_LIMIT,
  earningsRepository,
  type EarningsRepository,
  type LedgerFilter,
  type LedgerRowRaw,
} from './earnings.repository';
import type { EarningsLedgerDto, EarningsSummaryDto, LedgerDayDto, LedgerRowDto } from './earnings.types';
import type { ExportQuery, LedgerQuery } from './earnings.validation';

const toRowDto = (r: LedgerRowRaw): LedgerRowDto => ({
  id: r.id,
  bookingId: r.bookingId,
  partnerId: r.partnerId,
  gross: round2(r.gross),
  commissionRate: r.commissionRate,
  commission: round2(r.commission),
  net: round2(r.net),
  status: r.status,
  earnedAt: r.earnedAt.toISOString(),
  settledAt: r.settledAt ? r.settledAt.toISOString() : null,
  serviceName: r.serviceName,
});

/** from/to are business-time calendar days; `to` is inclusive, so the query's upper bound is the start of the next day. */
const toFilter = (q: { from?: string; to?: string; status?: LedgerFilter['status'] }, offset: number): LedgerFilter => ({
  from: q.from ? parseLocalDate(q.from, offset) : undefined,
  to: q.to ? new Date(parseLocalDate(q.to, offset).getTime() + 86_400_000) : undefined,
  status: q.status,
});

/** Every day from the first to the last in the range, with 0 where nothing was earned, so the chart has no gaps. */
function fillDays(series: LedgerDayDto[], from: string | undefined, to: string | undefined, offset: number): LedgerDayDto[] {
  const first = from ?? series[0]?.date;
  const last = to ?? series[series.length - 1]?.date;
  if (!first || !last || first > last) return [];
  const byDate = new Map(series.map((d) => [d.date, d.net]));
  const out: LedgerDayDto[] = [];
  const end = parseLocalDate(last, offset).getTime();
  for (let t = parseLocalDate(first, offset).getTime(); t <= end; t += 86_400_000) {
    const date = toLocalDateString(new Date(t), offset);
    out.push({ date, net: round2(byDate.get(date) ?? 0) });
  }
  return out;
}

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

const requirePartnerId = async (userId: string, repo: EarningsRepository): Promise<string> => {
  const partnerId = await repo.findPartnerIdByUserId(userId);
  if (!partnerId) throw Errors.notFound(ERROR_CODES.PARTNER_NOT_FOUND, 'No partner profile found for this account');
  return partnerId;
};

const envRate = (): number => {
  const n = Number(process.env.DEFAULT_COMMISSION_RATE);
  return process.env.DEFAULT_COMMISSION_RATE && Number.isFinite(n) && n >= 0 && n <= 1 ? n : FALLBACK_COMMISSION_RATE;
};

export const earningsService = {
  /**
   * job.completed handler. Idempotent: the unique index on bookingId turns a repeated event into a no-op.
   * Insert-and-catch (not check-then-insert) so two simultaneous deliveries can't both succeed.
   */
  async recordJobCompleted(
    payload: JobCompletedPayload,
    repo: EarningsRepository = earningsRepository,
  ): Promise<{ created: boolean }> {
    const rate = (await repo.getCommissionRate()) ?? envRate();
    const split = splitEarning(payload.gross, rate);
    try {
      await repo.create({
        partnerId: payload.partnerId,
        bookingId: payload.bookingId,
        ...split,
        earnedAt: payload.completedAt,
      });
      return { created: true };
    } catch (err) {
      if (isDuplicateKeyError(err)) return { created: false };
      throw err;
    }
  },

  /**
   * @param userId from the verified JWT
   * @param requestedPartnerId optional client-supplied id; anything other than the caller's own Partner id is a 404
   */
  async getSummary(
    userId: string,
    requestedPartnerId?: string,
    now: Date = new Date(),
    repo: EarningsRepository = earningsRepository,
  ): Promise<EarningsSummaryDto> {
    const partnerId = await requirePartnerId(userId, repo);
    if (requestedPartnerId && requestedPartnerId !== partnerId) {
      throw Errors.notFound(ERROR_CODES.NOT_FOUND, 'Earnings not found');
    }

    const { start, end } = dayBounds(now);
    const t = await repo.summarize(partnerId, {
      todayStart: start,
      tomorrowStart: end,
      weekStart: weekStart(now),
      monthStart: monthStart(now),
    });
    return {
      currency: 'INR',
      today: round2(t.today),
      week: round2(t.week),
      month: round2(t.month),
      total: round2(t.total),
      pending: round2(t.pending),
    };
  },

  /** GET /partner/earnings: filtered, paged ledger with totals and a daily series for the chart. */
  async getLedger(
    userId: string,
    query: LedgerQuery,
    repo: EarningsRepository = earningsRepository,
  ): Promise<EarningsLedgerDto> {
    const partnerId = await requirePartnerId(userId, repo);
    const offset = businessTzOffsetMinutes();
    const page = await repo.listLedger(partnerId, toFilter(query, offset), query.page, query.limit, offset);
    return {
      currency: 'INR',
      items: page.items.map(toRowDto),
      totals: {
        count: page.totals.count,
        gross: round2(page.totals.gross),
        commission: round2(page.totals.commission),
        net: round2(page.totals.net),
      },
      series: fillDays(page.series, query.from, query.to, offset),
      pagination: {
        page: query.page,
        limit: query.limit,
        total: page.total,
        pages: Math.max(1, Math.ceil(page.total / query.limit)),
      },
    };
  },

  /** GET /partner/earnings/export: all rows for the filter as CSV text (the controller sets the headers). */
  async exportCsv(
    userId: string,
    query: ExportQuery,
    repo: EarningsRepository = earningsRepository,
  ): Promise<{ csv: string; filename: string }> {
    const partnerId = await requirePartnerId(userId, repo);
    const offset = businessTzOffsetMinutes();
    const rows = await repo.listForExport(partnerId, toFilter(query, offset));
    if (rows.length > EXPORT_ROW_LIMIT) {
      throw Errors.badRequest(`Too many rows to export (over ${EXPORT_ROW_LIMIT}). Narrow the date range and try again.`);
    }
    const label = query.from || query.to ? `${query.from ?? 'start'}_to_${query.to ?? 'today'}` : 'all';
    return { csv: buildEarningsCsv(rows.map(toRowDto), offset), filename: `earnings-${label}.csv` };
  },
};