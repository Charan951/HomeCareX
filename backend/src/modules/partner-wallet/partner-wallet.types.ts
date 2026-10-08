import type { WalletTransactionStatus, WalletTransactionType } from './partner-wallet.constants';

/** One ledger line. `amount` is signed INR rounded to 2 decimals (credit > 0, debit < 0). */
export interface TransactionDto {
  id: string;
  type: WalletTransactionType;
  amount: number;
  status: WalletTransactionStatus;
  description: string;
  bookingId: string | null;
  createdAt: string;
}

/** GET /partner/transactions */
export interface TransactionsPageDto {
  currency: 'INR';
  items: TransactionDto[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

/** GET /partner/wallet. `available` = settled ledger sum, `pending` = pending ledger sum (both computed on the server). */
export interface WalletSummaryDto {
  currency: 'INR';
  available: number;
  pending: number;
  recent: TransactionDto[];
}