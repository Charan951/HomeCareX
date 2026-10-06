import type { PayoutItem, PayoutsList } from '../types/payouts';

const history: PayoutItem[] = [
  {
    id: '665f1a000000000000000001',
    amount: 4850,
    currency: 'INR',
    status: 'processing',
    method: 'bank_transfer',
    transactionId: null,
    batchId: 'BATCH-2026-10-A',
    expectedDate: '2026-10-08T00:00:00.000Z',
    paidAt: null,
    createdAt: '2026-10-05T09:30:00.000Z',
  },
  {
    id: '665f1a000000000000000002',
    amount: 6200,
    currency: 'INR',
    status: 'paid',
    method: 'upi',
    transactionId: 'UTR426810045532',
    batchId: 'BATCH-2026-09-B',
    expectedDate: '2026-09-25T00:00:00.000Z',
    paidAt: '2026-09-25T11:12:00.000Z',
    createdAt: '2026-09-22T09:00:00.000Z',
  },
  {
    id: '665f1a000000000000000003',
    amount: 3100,
    currency: 'INR',
    status: 'failed',
    method: 'bank_transfer',
    transactionId: null,
    batchId: 'BATCH-2026-09-A',
    expectedDate: '2026-09-15T00:00:00.000Z',
    paidAt: null,
    createdAt: '2026-09-12T09:00:00.000Z',
  },
  {
    id: '665f1a000000000000000004',
    amount: 7450,
    currency: 'INR',
    status: 'paid',
    method: 'bank_transfer',
    transactionId: 'NEFT2026082900781234',
    batchId: 'BATCH-2026-08-B',
    expectedDate: '2026-08-29T00:00:00.000Z',
    paidAt: '2026-08-29T10:05:00.000Z',
    createdAt: '2026-08-26T09:00:00.000Z',
  },
  {
    id: '665f1a000000000000000005',
    amount: 2900,
    currency: 'INR',
    status: 'pending',
    method: null,
    transactionId: null,
    batchId: null,
    expectedDate: null,
    paidAt: null,
    createdAt: '2026-10-06T06:00:00.000Z',
  },
];

export type MockMode = 'data' | 'empty' | 'error';

export const mockList = async (mode: MockMode): Promise<PayoutsList> => {
  await new Promise((r) => setTimeout(r, 600));
  if (mode === 'error') throw new Error('mock error');
  if (mode === 'empty') return { currency: 'INR', next: null, history: [] };
  const open = history.find((p) => p.status === 'processing') ?? null;
  return {
    currency: 'INR',
    next: open
      ? { id: open.id, amount: open.amount, currency: 'INR', status: open.status, expectedDate: open.expectedDate }
      : null,
    history,
  };
};

export const mockGet = async (id: string): Promise<PayoutItem> => {
  await new Promise((r) => setTimeout(r, 300));
  const found = history.find((p) => p.id === id);
  if (!found) throw new Error('not found');
  return found;
};