import { ERROR_CODES } from '../../constants/errorCodes';
import { businessTzOffsetMinutes, parseLocalDate } from '../../utils/dates';
import { Errors } from '../../utils/errors';
import {
  partnerWalletRepository,
  type PartnerWalletRepository,
  type TransactionFilter,
  type TransactionRowRaw,
} from './partner-wallet.repository';
import type { TransactionDto, TransactionsPageDto, WalletSummaryDto } from './partner-wallet.types';
import type { TransactionsQuery } from './partner-wallet.validation';

/** Rounds half away from zero, so a debit and the matching credit round to the same size. */
const round2 = (n: number): number => Math.sign(n) * (Math.round((Math.abs(n) + Number.EPSILON) * 100) / 100);

const toDto = (r: TransactionRowRaw): TransactionDto => ({
  id: r.id,
  type: r.type,
  amount: round2(r.amount),
  status: r.status,
  description: r.description,
  bookingId: r.bookingId,
  createdAt: r.createdAt.toISOString(),
});

/** from/to are business-time calendar days; `to` is inclusive, so the upper bound is the start of the next day. */
const toFilter = (q: Pick<TransactionsQuery, 'type' | 'from' | 'to'>, offset: number): TransactionFilter => ({
  type: q.type,
  from: q.from ? parseLocalDate(q.from, offset) : undefined,
  to: q.to ? new Date(parseLocalDate(q.to, offset).getTime() + 86_400_000) : undefined,
});

/** How many recent lines the wallet page shows. */
const RECENT_LIMIT = 10;

export const partnerWalletService = {
  /**
   * GET /partner/transactions
   * @param userId from the verified JWT, never from the request
   * @param query  validated query; a client-supplied `partnerId` is only compared, never used
   */
  async getTransactions(
    userId: string,
    query: TransactionsQuery,
    repo: PartnerWalletRepository = partnerWalletRepository,
  ): Promise<TransactionsPageDto> {
    const partnerId = await repo.findPartnerIdByUserId(userId);
    if (!partnerId) throw Errors.notFound(ERROR_CODES.PARTNER_NOT_FOUND, 'No partner profile found for this account');
    if (query.partnerId && query.partnerId !== partnerId) {
      throw Errors.notFound(ERROR_CODES.NOT_FOUND, 'Transactions not found');
    }

    const { items, total } = await repo.listTransactions(
      partnerId,
      toFilter(query, businessTzOffsetMinutes()),
      query.page,
      query.limit,
    );
    return {
      currency: 'INR',
      items: items.map(toDto),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },
  /**
   * GET /partner/wallet
   * The balance is always computed here from the ledger; nothing the client sends is used for money.
   * @param userId from the verified JWT, never from the request
   */
  async getSummary(userId: string, repo: PartnerWalletRepository = partnerWalletRepository): Promise<WalletSummaryDto> {
    const partnerId = await repo.findPartnerIdByUserId(userId);
    if (!partnerId) throw Errors.notFound(ERROR_CODES.PARTNER_NOT_FOUND, 'No partner profile found for this account');
    const { totals, recent } = await repo.getSummary(partnerId, RECENT_LIMIT);
    return {
      currency: 'INR',
      available: round2(totals.available),
      pending: round2(totals.pending),
      recent: recent.map(toDto),
    };
  },
};