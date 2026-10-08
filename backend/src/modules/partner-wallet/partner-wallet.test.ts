import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';
import { parseLocalDate } from '../../utils/dates';
import WalletTransactionModel from './WalletTransaction';
import type { PartnerWalletRepository, TransactionFilter, TransactionRowRaw } from './partner-wallet.repository';
import { partnerWalletService } from './partner-wallet.service';
import { transactionsQuerySchema } from './partner-wallet.validation';

const PARTNER_ID = 'aaaaaaaaaaaaaaaaaaaaaaaa';

const rows: TransactionRowRaw[] = [
  { id: 't2', type: 'payout', amount: -1500.005, status: 'settled', description: 'Weekly payout', bookingId: null, createdAt: new Date('2026-09-30T06:00:00Z') },
  { id: 't1', type: 'earning', amount: 800, status: 'pending', description: 'AC service', bookingId: 'bbbbbbbbbbbbbbbbbbbbbbbb', createdAt: new Date('2026-09-29T20:00:00Z') },
];

function fakeRepo() {
  const calls: { partnerId: string; filter: TransactionFilter; page: number; limit: number }[] = [];
  const repo = {
    findPartnerIdByUserId: async (userId: string) => (userId === 'user-1' ? PARTNER_ID : null),
    listTransactions: async (partnerId: string, filter: TransactionFilter, page: number, limit: number) => {
      calls.push({ partnerId, filter, page, limit });
      return { items: rows, total: 23 };
    },
  };
  return { calls, repo: repo as unknown as PartnerWalletRepository };
}

const parse = (q: Record<string, unknown>) => transactionsQuerySchema.safeParse(q);

// ---------- validation ----------

test('defaults: page 1, limit 20', () => {
  const r = parse({});
  assert.ok(r.success);
  assert.equal(r.data.page, 1);
  assert.equal(r.data.limit, 20);
});

test('rejects an unknown type, a bad date, from > to, limit > 100, page < 1 and unknown keys', () => {
  assert.equal(parse({ type: 'bonus' }).success, false);
  assert.equal(parse({ from: '2026-02-30' }).success, false);
  assert.equal(parse({ from: '30-09-2026' }).success, false);
  assert.equal(parse({ from: '2026-10-05', to: '2026-10-01' }).success, false);
  assert.equal(parse({ limit: '101' }).success, false);
  assert.equal(parse({ page: '0' }).success, false);
  assert.equal(parse({ walletId: 'x' }).success, false);
});

test('accepts every ledger type and a valid range', () => {
  for (const type of ['earning', 'incentive', 'adjustment', 'payout', 'refund_deduction']) {
    assert.ok(parse({ type }).success, type);
  }
  assert.ok(parse({ from: '2026-10-01', to: '2026-10-01' }).success);
});

// ---------- service ----------

test('returns the page with rounded amounts, ISO dates and pagination', async () => {
  const { repo } = fakeRepo();
  const res = await partnerWalletService.getTransactions('user-1', { page: 2, limit: 10 }, repo);
  assert.equal(res.currency, 'INR');
  assert.equal(res.items[0].amount, -1500.01);
  assert.equal(res.items[0].createdAt, '2026-09-30T06:00:00.000Z');
  assert.deepEqual(res.pagination, { page: 2, limit: 10, total: 23, pages: 3 });
});

test('always queries with the signed-in partner, and passes type through', async () => {
  const { repo, calls } = fakeRepo();
  await partnerWalletService.getTransactions('user-1', { page: 1, limit: 20, type: 'payout' }, repo);
  assert.equal(calls[0].partnerId, PARTNER_ID);
  assert.equal(calls[0].filter.type, 'payout');
});

test('"to" is inclusive: the upper bound is the start of the next day', async () => {
  const { repo, calls } = fakeRepo();
  await partnerWalletService.getTransactions('user-1', { page: 1, limit: 20, from: '2026-10-01', to: '2026-10-03' }, repo);
  const { from, to } = calls[0].filter;
  assert.equal(from?.getTime(), parseLocalDate('2026-10-01').getTime());
  assert.equal(to?.getTime(), parseLocalDate('2026-10-04').getTime());
});

test("another partner's id is a 404 and never reaches the data layer", async () => {
  const { repo, calls } = fakeRepo();
  await assert.rejects(
    partnerWalletService.getTransactions('user-1', { page: 1, limit: 20, partnerId: 'cccccccccccccccccccccccc' }, repo),
    (e: { status?: number }) => e.status === 404,
  );
  assert.equal(calls.length, 0);
});

test('your own partner id is accepted', async () => {
  const { repo } = fakeRepo();
  const res = await partnerWalletService.getTransactions('user-1', { page: 1, limit: 20, partnerId: PARTNER_ID }, repo);
  assert.equal(res.items.length, 2);
});

test('an account without a partner profile gets 404', async () => {
  const { repo } = fakeRepo();
  await assert.rejects(
    partnerWalletService.getTransactions('someone-else', { page: 1, limit: 20 }, repo),
    (e: { status?: number }) => e.status === 404,
  );
});

test('empty ledger still returns one page', async () => {
  const repo = {
    findPartnerIdByUserId: async () => PARTNER_ID,
    listTransactions: async () => ({ items: [], total: 0 }),
  } as unknown as PartnerWalletRepository;
  const res = await partnerWalletService.getTransactions('user-1', { page: 1, limit: 20 }, repo);
  assert.deepEqual(res.items, []);
  assert.equal(res.pagination.pages, 1);
});

// ---------- model: sign must match type ----------

/** Resolves to the amount error message, or undefined when the line is valid. (validate(), not validateSync(): the sign rule is a pre-validate hook.) */
const amountError = async (type: string, amount: number): Promise<string | undefined> => {
  try {
    await new WalletTransactionModel({ partnerId: new Types.ObjectId(), type, amount, description: 't' }).validate();
    return undefined;
  } catch (e) {
    return (e as { errors?: Record<string, { message: string }> }).errors?.amount?.message ?? 'invalid';
  }
};

test('ledger signs: earning/incentive are credits, payout/refund_deduction are debits, adjustment is either', async () => {
  assert.equal(await amountError('earning', 100), undefined);
  assert.equal(await amountError('incentive', 100), undefined);
  assert.equal(await amountError('payout', -100), undefined);
  assert.equal(await amountError('refund_deduction', -100), undefined);
  assert.equal(await amountError('adjustment', 50), undefined);
  assert.equal(await amountError('adjustment', -50), undefined);

  assert.match((await amountError('earning', -100)) ?? '', /positive/);
  assert.match((await amountError('incentive', -1)) ?? '', /positive/);
  assert.match((await amountError('payout', 100)) ?? '', /negative/);
  assert.match((await amountError('refund_deduction', 100)) ?? '', /negative/);
  assert.ok(await amountError('adjustment', 0));
});

// ---------- wallet summary ----------

function summaryRepo() {
  const calls: { partnerId: string; limit: number }[] = [];
  const repo = {
    findPartnerIdByUserId: async (userId: string) => (userId === 'user-1' ? PARTNER_ID : null),
    getSummary: async (partnerId: string, limit: number) => {
      calls.push({ partnerId, limit });
      return { totals: { available: 1234.505, pending: 800 }, recent: rows };
    },
  };
  return { calls, repo: repo as unknown as PartnerWalletRepository };
}

test('wallet summary: server-computed available and pending, rounded, plus recent lines', async () => {
  const { repo } = summaryRepo();
  const res = await partnerWalletService.getSummary('user-1', repo);
  assert.equal(res.currency, 'INR');
  assert.equal(res.available, 1234.51);
  assert.equal(res.pending, 800);
  assert.equal(res.recent.length, 2);
  assert.equal(res.recent[0].createdAt, '2026-09-30T06:00:00.000Z');
});

test('wallet summary: always scoped to the signed-in partner', async () => {
  const { repo, calls } = summaryRepo();
  await partnerWalletService.getSummary('user-1', repo);
  assert.equal(calls[0].partnerId, PARTNER_ID);
  assert.ok(calls[0].limit > 0);
});

test('wallet summary: an account without a partner profile gets 404', async () => {
  const { repo, calls } = summaryRepo();
  await assert.rejects(
    partnerWalletService.getSummary('nobody', repo),
    (e: { status?: number }) => e.status === 404,
  );
  assert.equal(calls.length, 0);
});