import { AppError } from '../../utils/AppError';
import { CREDIT_TYPES, type LedgerType } from './wallet.constants';
import { paiseToRupees, rupeesToPaise } from './wallet.money';
import { walletRepository, type WalletRepository } from './wallet.repository';
import type { IWalletLedger } from './wallet.model';

export interface MovementInput {
  customerId: string;
  amount: number; // INR
  type: LedgerType;
  description: string;
  bookingId?: string;
  paymentId?: string;
  /** Pass one for anything retryable (refund for booking X): the movement then happens exactly once. */
  idempotencyKey?: string;
}

export interface LedgerEntryDto {
  id: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  description: string;
  bookingId: string | null;
  createdAt: string;
}

export const toLedgerDto = (row: IWalletLedger): LedgerEntryDto => ({
  id: String(row._id),
  type: row.type,
  amount: paiseToRupees(row.amountPaise),
  balanceAfter: paiseToRupees(row.balanceAfterPaise),
  description: row.description,
  bookingId: row.bookingId ? String(row.bookingId) : null,
  createdAt: row.createdAt.toISOString(),
});

const isDuplicateKey = (err: unknown): boolean => (err as { code?: number })?.code === 11000;

export function createWalletService(repo: WalletRepository = walletRepository) {
  /** Writes the ledger row after the balance moved; undoes the balance move if that write fails. */
  async function record(input: MovementInput, amountPaise: number, balanceAfter: number, undo: () => Promise<unknown>) {
    try {
      return await repo.insertLedger({
        customerId: input.customerId,
        type: input.type,
        amountPaise,
        balanceAfterPaise: balanceAfter,
        description: input.description,
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        idempotencyKey: input.idempotencyKey,
      });
    } catch (err) {
      await undo(); // keep balance == sum(ledger)
      if (isDuplicateKey(err) && input.idempotencyKey) {
        const existing = await repo.findLedgerByKey(input.customerId, input.idempotencyKey);
        if (existing) return existing; // lost an idempotency race: the other call already did it
      }
      throw err;
    }
  }

  return {
    /** Adds money. credit / refund_credit / referral_reward. Idempotent when a key is given. */
    async credit(input: MovementInput): Promise<{ entry: LedgerEntryDto; balance: number; replayed: boolean }> {
      if (!CREDIT_TYPES.includes(input.type)) throw new AppError(400, 'VALIDATION_ERROR', 'Not a credit type');
      const paise = rupeesToPaise(input.amount);

      if (input.idempotencyKey) {
        const prior = await repo.findLedgerByKey(input.customerId, input.idempotencyKey);
        if (prior) return { entry: toLedgerDto(prior), balance: paiseToRupees(await repo.getBalance(input.customerId)), replayed: true };
      }

      const balanceAfter = await repo.creditBalance(input.customerId, paise);
      const row = await record(input, paise, balanceAfter, () => repo.debitBalanceIfEnough(input.customerId, paise));
      const replayed = row.balanceAfterPaise !== balanceAfter;
      return { entry: toLedgerDto(row), balance: paiseToRupees(await repo.getBalance(input.customerId)), replayed };
    },

    /** Removes money; throws 409 INSUFFICIENT_BALANCE instead of ever going below zero. */
    async debit(input: MovementInput): Promise<{ entry: LedgerEntryDto; balance: number; replayed: boolean }> {
      if (input.type !== 'debit') throw new AppError(400, 'VALIDATION_ERROR', 'Not a debit type');
      const paise = rupeesToPaise(input.amount);

      if (input.idempotencyKey) {
        const prior = await repo.findLedgerByKey(input.customerId, input.idempotencyKey);
        if (prior) return { entry: toLedgerDto(prior), balance: paiseToRupees(await repo.getBalance(input.customerId)), replayed: true };
      }

      const balanceAfter = await repo.debitBalanceIfEnough(input.customerId, paise);
      if (balanceAfter === null) throw new AppError(409, 'INSUFFICIENT_BALANCE', 'Not enough wallet balance');

      const row = await record(input, paise, balanceAfter, () => repo.creditBalance(input.customerId, paise));
      const replayed = row.balanceAfterPaise !== balanceAfter;
      return { entry: toLedgerDto(row), balance: paiseToRupees(await repo.getBalance(input.customerId)), replayed };
    },

    /** GET /wallet */
    async getWallet(customerId: string, page: number, limit: number, type?: string) {
      const [balancePaise, { rows, total }] = await Promise.all([repo.getBalance(customerId), repo.listLedger(customerId, page, limit, type)]);
      return { balance: paiseToRupees(balancePaise), currency: 'INR', ledger: { items: rows.map(toLedgerDto), page, limit, total } };
    },
  };
}

export const walletService = createWalletService();
