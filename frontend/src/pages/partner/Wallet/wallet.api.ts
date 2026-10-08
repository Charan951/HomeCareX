// MOCK: backend /partner/wallet doesn't exist yet (current /wallet is customer-only).
// Swap this file's contents for a real http() call once Charan951 confirms the partner
// wallet API — nothing in index.tsx should need to change if the shape below holds.

export type LedgerType = 'earning' | 'incentive' | 'adjustment' | 'payout' | 'refund_deduction';

export interface LedgerEntry {
  id: string;
  type: LedgerType;
  amount: number;    // INR; negative = money leaving the wallet (payout, refund_deduction)
  description: string;
  createdAt: string;  // ISO
}

export interface WalletSummary {
  available: number;
  pending: number;
  currency: 'INR';
  recent: LedgerEntry[];
}

const MOCK_RECENT: LedgerEntry[] = [
  { id: '1', type: 'earning', amount: 850, description: 'Booking #BK10231 completed', createdAt: '2026-10-06T14:20:00.000Z' },
  { id: '2', type: 'incentive', amount: 150, description: 'Weekly streak bonus', createdAt: '2026-10-05T09:00:00.000Z' },
  { id: '3', type: 'payout', amount: -2000, description: 'Payout to bank account', createdAt: '2026-10-03T11:30:00.000Z' },
  { id: '4', type: 'adjustment', amount: -50, description: 'Late arrival adjustment', createdAt: '2026-10-02T16:45:00.000Z' },
  { id: '5', type: 'refund_deduction', amount: -300, description: 'Customer refund — Booking #BK10190', createdAt: '2026-10-01T10:10:00.000Z' },
];

export const getWalletSummary = (): Promise<WalletSummary> =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ available: 4820, pending: 1350, currency: 'INR', recent: MOCK_RECENT }), 400);
  });