import assert from 'node:assert/strict';
import test from 'node:test';
import { monthStart, weekStart } from '../../utils/dates';
import { splitEarning } from './earnings.calc';
import { buildEarningsCsv, csvCell } from './earnings.csv';
import type { EarningsRepository, LedgerFilter, LedgerRowRaw, NewEarning } from './earnings.repository';
import { earningsService } from './earnings.service';
import { exportQuerySchema, ledgerQuerySchema } from './earnings.validation';

const ledgerRows: LedgerRowRaw[] = [
  {
    id: 'e2', bookingId: 'b2', partnerId: 'aaaaaaaaaaaaaaaaaaaaaaaa', gross: 500, commissionRate: 0.2, commission: 100, net: 400,
    status: 'settled', earnedAt: new Date('2026-09-30T06:00:00Z'), settledAt: new Date('2026-09-30T12:00:00Z'), serviceName: 'AC "Deep" Clean, 2 units',
  },
  {
    id: 'e1', bookingId: 'b1', partnerId: 'aaaaaaaaaaaaaaaaaaaaaaaa', gross: 1000.005, commissionRate: 0.2, commission: 200, net: 800.005,
    status: 'pending', earnedAt: new Date('2026-09-29T20:00:00Z'), settledAt: null, serviceName: '=HYPERLINK("http://x")',
  },
];

/** In-memory repo that enforces the same unique-bookingId rule as the Mongo index. */
function fakeRepo(rate: number | null = 0.2) {
  const rows = new Map<string, NewEarning>();
  const calls: { filter: LedgerFilter; page?: number; limit?: number }[] = [];
  const repo = {
    getCommissionRate: async () => rate,
    create: async (data: NewEarning) => {
      if (rows.has(data.bookingId)) throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
      rows.set(data.bookingId, data);
      return data;
    },
    findPartnerIdByUserId: async (userId: string) => (userId === 'user-1' ? 'aaaaaaaaaaaaaaaaaaaaaaaa' : null),
    listLedger: async (_p: string, filter: LedgerFilter, page: number, limit: number) => {
      calls.push({ filter, page, limit });
      return {
        items: ledgerRows,
        totals: { count: 2, gross: 1500.005, commission: 300, net: 1200.01 },
        series: [{ date: '2026-09-29', net: 700.004 }, { date: '2026-09-30', net: 500 }],
        total: 2,
      };
    },
    listForExport: async (_p: string, filter: LedgerFilter) => {
      calls.push({ filter });
      return ledgerRows;
    },
    summarize: async () => ({ today: 100.005, week: 250, month: 900.1 + 0.2, total: 5000, pending: 0 }),
  };
  return { rows, calls, repo: repo as unknown as EarningsRepository };
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

const q = (o: Record<string, unknown>) => ledgerQuerySchema.parse(o);

test('ledger: rounds money, keeps pagination, fills empty days in the chart series', async () => {
  const { repo } = fakeRepo();
  const l = await earningsService.getLedger('user-1', q({ from: '2026-09-28', to: '2026-10-01', limit: '1' }), repo);
  assert.deepEqual(l.totals, { count: 2, gross: 1500.01, commission: 300, net: 1200.01 });
  assert.deepEqual(l.series, [
    { date: '2026-09-28', net: 0 },
    { date: '2026-09-29', net: 700 },
    { date: '2026-09-30', net: 500 },
    { date: '2026-10-01', net: 0 },
  ]);
  assert.deepEqual(l.pagination, { page: 1, limit: 1, total: 2, pages: 2 });
  assert.equal(l.items[1].gross, 1000.01);
  assert.equal(l.items[0].earnedAt, '2026-09-30T06:00:00.000Z');
});

test('ledger/export: no partner profile -> 404', async () => {
  const { repo } = fakeRepo();
  await assert.rejects(earningsService.getLedger('nobody', q({}), repo), { status: 404 });
  await assert.rejects(earningsService.exportCsv('nobody', exportQuerySchema.parse({}), repo), { status: 404 });
});

test('date range is inclusive of the "to" day, in IST', async () => {
  const { repo, calls } = fakeRepo();
  await earningsService.getLedger('user-1', q({ from: '2026-09-01', to: '2026-09-30', status: 'pending' }), repo);
  const f = calls[0].filter;
  assert.equal(f.from?.toISOString(), '2026-08-31T18:30:00.000Z'); // 1 Sep 00:00 IST
  assert.equal(f.to?.toISOString(), '2026-09-30T18:30:00.000Z'); // 1 Oct 00:00 IST, exclusive
  assert.equal(f.status, 'pending');
});

test('query validation: bad dates, reversed or oversized ranges, unknown fields, bad paging', () => {
  assert.equal(ledgerQuerySchema.safeParse({ from: '2026-02-30' }).success, false);
  assert.equal(ledgerQuerySchema.safeParse({ from: '30-09-2026' }).success, false);
  assert.equal(ledgerQuerySchema.safeParse({ from: '2026-10-02', to: '2026-10-01' }).success, false);
  assert.equal(ledgerQuerySchema.safeParse({ from: '2025-01-01', to: '2026-09-30' }).success, false);
  assert.equal(ledgerQuerySchema.safeParse({ status: 'paid' }).success, false);
  assert.equal(ledgerQuerySchema.safeParse({ partnerId: 'x' }).success, false);
  assert.equal(ledgerQuerySchema.safeParse({ page: '0' }).success, false);
  assert.equal(ledgerQuerySchema.safeParse({ limit: '101' }).success, false);
  assert.equal(exportQuerySchema.safeParse({ page: '2' }).success, false);
  const ok = ledgerQuerySchema.parse({});
  assert.deepEqual({ page: ok.page, limit: ok.limit }, { page: 1, limit: 20 });
  assert.equal(ledgerQuerySchema.safeParse({ from: '2026-01-01', to: '2026-12-31' }).success, true);
});

test('CSV: header, quoting, formula guard, BOM, CRLF, filename', async () => {
  assert.equal(csvCell('a,b'), '"a,b"');
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell('=1+1'), "'=1+1");
  assert.equal(csvCell(-5), '-5'); // real numbers are not text, so no guard
  assert.equal(csvCell(null), '');

  const { repo } = fakeRepo();
  const { csv, filename } = await earningsService.exportCsv('user-1', exportQuerySchema.parse({ from: '2026-09-29' }), repo);
  assert.equal(filename, 'earnings-2026-09-29_to_today.csv');
  assert.ok(csv.startsWith('\uFEFFDate,Booking ID,Service,Gross (INR),'));
  const lines = csv.trimEnd().split('\r\n');
  assert.equal(lines.length, 3);
  assert.equal(lines[1], '2026-09-30,b2,"AC ""Deep"" Clean, 2 units",500.00,20,100.00,400.00,settled,2026-09-30');
  assert.equal(lines[2], '2026-09-30,b1,"\'=HYPERLINK(""http://x"")",1000.01,20,200.00,800.01,pending,');
  assert.equal(buildEarningsCsv([]).trimEnd().split('\r\n').length, 1);
});