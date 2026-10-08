import type { LedgerEntry, LedgerType } from '../Wallet/wallet.api';

// MOCK: same backend gap as Wallet. Swap for the real ledger endpoint once it exists.

const ALL: LedgerEntry[] = [
  { id: '1', type: 'earning', amount: 850, description: 'Booking #BK10231 completed', createdAt: '2026-10-06T14:20:00.000Z' },
  { id: '2', type: 'incentive', amount: 150, description: 'Weekly streak bonus', createdAt: '2026-10-05T09:00:00.000Z' },
  { id: '3', type: 'payout', amount: -2000, description: 'Payout to bank account', createdAt: '2026-10-03T11:30:00.000Z' },
  { id: '4', type: 'adjustment', amount: -50, description: 'Late arrival adjustment', createdAt: '2026-10-02T16:45:00.000Z' },
  { id: '5', type: 'refund_deduction', amount: -300, description: 'Customer refund — Booking #BK10190', createdAt: '2026-10-01T10:10:00.000Z' },
  { id: '6', type: 'earning', amount: 620, description: 'Booking #BK10180 completed', createdAt: '2026-09-29T13:05:00.000Z' },
  { id: '7', type: 'earning', amount: 900, description: 'Booking #BK10172 completed', createdAt: '2026-09-28T10:40:00.000Z' },
  { id: '8', type: 'incentive', amount: 200, description: 'Referral bonus', createdAt: '2026-09-27T08:15:00.000Z' },
];

export interface TransactionsPage {
  items: LedgerEntry[];
  page: number;
  limit: number;
  total: number;
}

export const getTransactions = (page: number, limit: number, type?: LedgerType): Promise<TransactionsPage> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const filtered = type ? ALL.filter((e) => e.type === type) : ALL;
      const start = (page - 1) * limit;
      resolve({ items: filtered.slice(start, start + limit), page, limit, total: filtered.length });
    }, 350);
  });