import assert from 'node:assert/strict';
import test from 'node:test';
import { monthStart, weekStart } from '../../utils/dates';
import { splitEarning } from './earnings.calc';
import type { EarningsRepository, NewEarning } from './earnings.repository';
import { earningsService } from './earnings.service';

/** In-memory repo that enforces the same unique-bookingId rule as the Mongo index. */
function fakeRepo(rate: number | null = 0.2) {
  const rows = new Map<string, NewEarning>();
  const repo = {
    getCommissionRate: async () => rate,
    create: async (data: NewEarning) => {
      if (rows.has(data.bookingId)) throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
      rows.set(data.bookingId, data);
      return data;
    },
    findPartnerIdByUserId: async (userId: string) => (userId === 'user-1' ? 'aaaaaaaaaaaaaaaaaaaaaaaa' : null),
    summarize: async () => ({ today: 100.005, week: 250, month: 900.1 + 0.2, total: 5000, pending: 0 }),
  };
  return { rows, repo: repo as unknown as EarningsRepository };
}

const payload = { bookingId: 'b1', partnerId: 'p1', gross: 1000, completedAt: new Date('2026-09-30T06:00:00Z') };

test('duplicate job.completed event is ignored (one earning per booking)', async () => {
  const { rows, repo } = fakeRepo();
  assert.deepEqual(await earningsService.recordJobCompleted(payload, repo), { created: true });
  assert.deepEqual(await earningsService.recordJobCompleted(payload, repo), { created: false });
  assert.equal(rows.size, 1);
});

test('two simultaneous deliveries still produce one earning', async () => {
  const { rows, repo } = fakeRepo();
  await Promise.all([earningsService.recordJobCompleted(payload, repo), earningsService.recordJobCompleted(payload, repo)]);
  assert.equal(rows.size, 1);
});

test('commission uses the rate from Settings and is frozen on the row', async () => {
  const { rows, repo } = fakeRepo(0.15);
  await earningsService.recordJobCompleted(payload, repo);
  assert.deepEqual(
    { rate: rows.get('b1')?.commissionRate, commission: rows.get('b1')?.commission, net: rows.get('b1')?.net },
    { rate: 0.15, commission: 150, net: 850 },
  );
});

test('falls back to the default rate when Settings has none', async () => {
  const { rows, repo } = fakeRepo(null);
  await earningsService.recordJobCompleted(payload, repo);
  assert.equal(rows.get('b1')?.commissionRate, 0.2);
});

test('non-duplicate errors are not swallowed', async () => {
  const { repo } = fakeRepo();
  (repo as unknown as { create: () => Promise<never> }).create = async () => {
    throw new Error('db down');
  };
  await assert.rejects(earningsService.recordJobCompleted(payload, repo), /db down/);
});

test('splitEarning keeps gross = commission + net and rounds to paise', () => {
  const s = splitEarning(999.99, 0.175);
  assert.equal(Math.round((s.commission + s.net) * 100), Math.round(s.gross * 100));
  assert.throws(() => splitEarning(-1, 0.2), RangeError);
  assert.throws(() => splitEarning(100, 1.5), RangeError);
});

test('summary rounds figures and returns numbers (never null)', async () => {
  const { repo } = fakeRepo();
  const s = await earningsService.getSummary('user-1', undefined, new Date('2026-09-30T06:00:00Z'), repo);
  assert.deepEqual(s, { currency: 'INR', today: 100.01, week: 250, month: 900.3, total: 5000, pending: 0 });
});

test("another partner's id -> 404, own id -> ok, no partner profile -> 404", async () => {
  const { repo } = fakeRepo();
  await assert.rejects(earningsService.getSummary('user-1', 'bbbbbbbbbbbbbbbbbbbbbbbb', new Date(), repo), { status: 404 });
  await assert.doesNotReject(earningsService.getSummary('user-1', 'aaaaaaaaaaaaaaaaaaaaaaaa', new Date(), repo));
  await assert.rejects(earningsService.getSummary('nobody', undefined, new Date(), repo), { status: 404 });
});

test('week starts Monday and month starts on the 1st, in IST', () => {
  const wed = new Date('2026-09-30T06:00:00Z'); // Wed 30 Sep 2026, 11:30 IST
  assert.equal(weekStart(wed, 330).toISOString(), '2026-09-27T18:30:00.000Z'); // Mon 28 Sep 00:00 IST
  assert.equal(monthStart(wed, 330).toISOString(), '2026-08-31T18:30:00.000Z'); // 1 Sep 00:00 IST
  const monIst = new Date('2026-10-04T19:00:00Z'); // Mon 5 Oct 00:30 IST -> a new week has begun
  assert.equal(weekStart(monIst, 330).toISOString(), '2026-10-04T18:30:00.000Z');
});