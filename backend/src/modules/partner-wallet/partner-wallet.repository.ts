import { Types } from 'mongoose';
import PartnerModel from '../../models/Partner';
import WalletTransactionModel from './WalletTransaction';
import type { WalletTransactionStatus, WalletTransactionType } from './partner-wallet.constants';

export interface TransactionFilter {
  type?: WalletTransactionType;
  /** Inclusive start instant. */
  from?: Date;
  /** Exclusive end instant. */
  to?: Date;
}

export interface TransactionRowRaw {
  id: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  description: string;
  bookingId: string | null;
  createdAt: Date;
}

type TransactionLean = {
  _id: Types.ObjectId;
  type: WalletTransactionType;
  amount: number;
  status?: WalletTransactionStatus;
  description?: string;
  bookingId?: Types.ObjectId | null;
  createdAt: Date;
};

/** The partner id is always part of the match, so a query can never read another partner's lines. */
const buildMatch = (partnerId: string, f: TransactionFilter): Record<string, unknown> => {
  const match: Record<string, unknown> = { partnerId: new Types.ObjectId(partnerId) };
  if (f.type) match.type = f.type;
  if (f.from || f.to) {
    match.createdAt = { ...(f.from ? { $gte: f.from } : {}), ...(f.to ? { $lt: f.to } : {}) };
  }
  return match;
};

export interface WalletTotalsRaw {
  /** Sum of `amount` over settled lines (signed INR). */
  available: number;
  /** Sum of `amount` over pending lines (signed INR). */
  pending: number;
}

const mapRow = (r: TransactionLean): TransactionRowRaw => ({
  id: String(r._id),
  type: r.type,
  amount: r.amount,
  status: r.status ?? 'settled',
  description: r.description ?? '',
  bookingId: r.bookingId ? String(r.bookingId) : null,
  createdAt: r.createdAt,
});

export const partnerWalletRepository = {
  findPartnerIdByUserId: async (userId: string): Promise<string | null> => {
    const partner = await PartnerModel.findOne({ userId }).select('_id').lean();
    return partner ? String(partner._id) : null;
  },

  /** One page, newest first. The `_id` tie-break keeps paging stable when lines share a timestamp. */
  listTransactions: async (
    partnerId: string,
    filter: TransactionFilter,
    page: number,
    limit: number,
  ): Promise<{ items: TransactionRowRaw[]; total: number }> => {
    const match = buildMatch(partnerId, filter);
    const [rows, total] = await Promise.all([
      WalletTransactionModel.find(match)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<TransactionLean[]>(),
      WalletTransactionModel.countDocuments(match),
    ]);
    return {
      total,
      items: rows.map((r) => ({
        id: String(r._id),
        type: r.type,
        amount: r.amount,
        status: r.status ?? 'settled',
        description: r.description ?? '',
        bookingId: r.bookingId ? String(r.bookingId) : null,
        createdAt: r.createdAt,
      })),
    };
  },
  /** Balance parts and the newest lines in one round trip. The partner id is always part of the match. */
  getSummary: async (
    partnerId: string,
    recentLimit: number,
  ): Promise<{ totals: WalletTotalsRaw; recent: TransactionRowRaw[] }> => {
    const match = { partnerId: new Types.ObjectId(partnerId) };
    const [groups, rows] = await Promise.all([
      WalletTransactionModel.aggregate<{ _id: WalletTransactionStatus; total: number }>([
        { $match: match },
        { $group: { _id: { $ifNull: ['$status', 'settled'] }, total: { $sum: '$amount' } } },
      ]),
      WalletTransactionModel.find(match)
        .sort({ createdAt: -1, _id: -1 })
        .limit(recentLimit)
        .lean<TransactionLean[]>(),
    ]);
    const sumOf = (s: WalletTransactionStatus) => groups.find((g) => g._id === s)?.total ?? 0;
    return { totals: { available: sumOf('settled'), pending: sumOf('pending') }, recent: rows.map(mapRow) };
  },
};

export type PartnerWalletRepository = typeof partnerWalletRepository;