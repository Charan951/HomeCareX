import { ERROR_CODES } from '../../constants/errorCodes';
import type { JobCompletedPayload } from '../events/eventBus';
import { dayBounds, monthStart, weekStart } from '../../utils/dates';
import { Errors } from '../../utils/errors';
import { round2, splitEarning } from './earnings.calc';
import { FALLBACK_COMMISSION_RATE } from './earnings.constants';
import { earningsRepository, type EarningsRepository } from './earnings.repository';
import type { EarningsSummaryDto } from './earnings.types';

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;

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
    const partnerId = await repo.findPartnerIdByUserId(userId);
    if (!partnerId) throw Errors.notFound(ERROR_CODES.PARTNER_NOT_FOUND, 'No partner profile found for this account');
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
};