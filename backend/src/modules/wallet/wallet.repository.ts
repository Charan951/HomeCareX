import { Types } from 'mongoose';
import { WalletLedgerModel, WalletModel, type IWalletLedger } from './wallet.model';

const oid = (id: string) => new Types.ObjectId(id);

export interface LedgerInsert {
  customerId: string;
  type: IWalletLedger['type'];
  amountPaise: number;
  balanceAfterPaise: number;
  description: string;
  bookingId?: string;
  paymentId?: string;
  idempotencyKey?: string;
}

/** Storage seam for wallet.service; the in-memory fake in wallet.test.ts implements the same shape. */
export interface WalletRepository {
  findLedgerByKey(customerId: string, key: string): Promise<IWalletLedger | null>;
  /** Atomic `balance += amount`; creates the wallet on first credit. Returns the new balance. */
  creditBalance(customerId: string, amountPaise: number): Promise<number>;
  /** Atomic `balance -= amount` ONLY IF balance >= amount. Returns the new balance, or null if funds are short. */
  debitBalanceIfEnough(customerId: string, amountPaise: number): Promise<number | null>;
  insertLedger(entry: LedgerInsert): Promise<IWalletLedger>;
  getBalance(customerId: string): Promise<number>;
  listLedger(customerId: string, page: number, limit: number, type?: string): Promise<{ rows: IWalletLedger[]; total: number }>;
}

export const walletRepository: WalletRepository = {
  findLedgerByKey: (customerId, key) => WalletLedgerModel.findOne({ customerId: oid(customerId), idempotencyKey: key }).exec(),

  async creditBalance(customerId, amountPaise) {
    const w = await WalletModel.findOneAndUpdate(
      { customerId: oid(customerId) },
      { $inc: { balancePaise: amountPaise }, $setOnInsert: { customerId: oid(customerId) } },
      { upsert: true, new: true },
    );
    return w.balancePaise;
  },

  async debitBalanceIfEnough(customerId, amountPaise) {
    // The `$gte` guard and the `$inc` are ONE atomic operation, so the balance can never go below zero,
    // however many debits race.
    const w = await WalletModel.findOneAndUpdate(
      { customerId: oid(customerId), balancePaise: { $gte: amountPaise } },
      { $inc: { balancePaise: -amountPaise } },
      { new: true },
    );
    return w ? w.balancePaise : null;
  },

  insertLedger: (e) =>
    WalletLedgerModel.create({
      customerId: oid(e.customerId),
      type: e.type,
      amountPaise: e.amountPaise,
      balanceAfterPaise: e.balanceAfterPaise,
      description: e.description,
      ...(e.bookingId ? { bookingId: oid(e.bookingId) } : {}),
      ...(e.paymentId ? { paymentId: oid(e.paymentId) } : {}),
      ...(e.idempotencyKey ? { idempotencyKey: e.idempotencyKey } : {}),
    }),

  async getBalance(customerId) {
    const w = await WalletModel.findOne({ customerId: oid(customerId) }).select('balancePaise').lean();
    return w?.balancePaise ?? 0;
  },

  async listLedger(customerId, page, limit, type) {
    const filter = { customerId: oid(customerId), ...(type ? { type } : {}) };
    const [total, rows] = await Promise.all([
      WalletLedgerModel.countDocuments(filter),
      WalletLedgerModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).exec(),
    ]);
    return { rows, total };
  },
};
