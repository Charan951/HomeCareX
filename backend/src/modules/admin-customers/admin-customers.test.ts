import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Aggregator } from 'mingo';
import { Types } from 'mongoose';
import { UserModel } from '../../models/User';
import { auditService } from '../audit/audit.service';
import { adminCustomersRepository } from './admin-customers.repository';
import { adminCustomersService, toActivityItem, toPaymentItem, toRow } from './admin-customers.service';
import { buildItemsPipeline, buildMatch, COLLATION, type CollectionNames, type CustomerAggRow } from './admin-customers.repository';
import {
  customerIdParamSchema,
  listCustomersQuerySchema,
  updateCustomerStatusSchema,
  type ListCustomersQuery,
} from './admin-customers.validation';

/* ---------------- seed: 4 customers, 1 partner, bookings ---------------- */

const oid = () => new Types.ObjectId();
const ANANYA = oid();
const BHARAT = oid();
const CHITRA = oid(); // blocked, no bookings, never logged in
const DEV = oid(); // legacy doc with no status field
const PARTNER = oid();

const d = (day: number) => new Date(Date.UTC(2026, 8, day, 9, 0, 0));
const COLLECTIONS: CollectionNames = { bookings: 'bookings' };

const users = [
  { _id: ANANYA, name: 'Ananya Rao', email: 'ananya@x.com', phone: '9000000011', role: 'customer', status: 'active', createdAt: d(1), lastLoginAt: d(20), passwordHash: 'secret' },
  { _id: BHARAT, name: 'bharat Singh', email: 'bharat@x.com', phone: '9000000012', role: 'customer', status: 'active', createdAt: d(2), lastLoginAt: d(5), passwordHash: 'secret' },
  { _id: CHITRA, name: 'Chitra Iyer', email: 'chitra@x.com', role: 'customer', status: 'blocked', createdAt: d(3), passwordHash: 'secret' },
  { _id: DEV, name: 'Dev Patel', email: 'dev@x.com', role: 'customer', createdAt: d(4), passwordHash: 'secret' },
  { _id: PARTNER, name: 'Ramesh Partner', email: 'ramesh@x.com', role: 'partner', status: 'active', createdAt: d(1) },
];

const bookings = [
  // Ananya: 3 bookings, two PAID (500 + 300), one pending -> ltv 800, last booking d(25)
  { customerId: ANANYA, paymentStatus: 'PAID', priceBreakdown: { total: 500 }, createdAt: d(10) },
  { customerId: ANANYA, paymentStatus: 'PAID', priceBreakdown: { total: 300 }, createdAt: d(25) },
  { customerId: ANANYA, paymentStatus: 'PENDING', priceBreakdown: { total: 999 }, createdAt: d(12) },
  // Bharat: 1 refunded booking -> ltv 0, but counts as a booking
  { customerId: BHARAT, paymentStatus: 'REFUNDED', priceBreakdown: { total: 400 }, createdAt: d(8) },
  // a booking without a priceBreakdown must not break the sum
  { customerId: DEV, paymentStatus: 'PAID', createdAt: d(9) },
];

const baseQuery: ListCustomersQuery = { sortBy: 'createdAt', sortDir: 'desc', page: 1, limit: 10 };
const run = (q: Partial<ListCustomersQuery>): CustomerAggRow[] =>
  new Aggregator(buildItemsPipeline({ ...baseQuery, ...q }, COLLECTIONS) as never, {
    collation: COLLATION,
    collectionResolver: (name: string) => (name === 'bookings' ? bookings : []) as never,
  }).run(users as never) as unknown as CustomerAggRow[];
const names = (rows: CustomerAggRow[]) => rows.map((r) => r.name);

/* ---------------- aggregation ---------------- */

test('returns customers only (never partners/admins)', () => {
  assert.equal(run({ limit: 50 }).length, 4);
});

test('bookingsCount counts every booking; ltv sums PAID totals only', () => {
  const rows = run({ limit: 50 });
  const by = (n: string) => rows.find((r) => r.name === n)!;
  assert.equal(by('Ananya Rao').bookingsCount, 3);
  assert.equal(by('Ananya Rao').ltv, 800);
  assert.equal(by('bharat Singh').bookingsCount, 1);
  assert.equal(by('bharat Singh').ltv, 0); // refunded
  assert.equal(by('Chitra Iyer').bookingsCount, 0);
  assert.equal(by('Chitra Iyer').ltv, 0);
  assert.equal(by('Dev Patel').ltv, 0); // PAID but no priceBreakdown
});

test('lastActivityAt is the later of last login and last booking, null if neither', () => {
  const rows = run({ limit: 50 });
  const by = (n: string) => rows.find((r) => r.name === n)!;
  assert.equal(+by('Ananya Rao').lastActivityAt!, +d(25)); // booking (25) beats login (20)
  assert.equal(+by('bharat Singh').lastActivityAt!, +d(8)); // booking (8) beats login (5)
  assert.equal(by('Chitra Iyer').lastActivityAt ?? null, null);
});

test('output never contains passwordHash or internal fields', () => {
  for (const row of run({ limit: 50 })) {
    assert.ok(!('passwordHash' in row));
    assert.ok(!('_stats' in row));
    assert.equal(toRow(row).id, String(row._id)); // ObjectId -> plain string id for the API
  }
});

test('legacy users without a status field show as active', () => {
  assert.equal(run({ limit: 50 }).find((r) => r.name === 'Dev Patel')!.status, 'active');
});

/* ---------------- filters ---------------- */

test('status filter: blocked / active (active includes legacy docs with no status)', () => {
  assert.deepEqual(names(run({ status: 'blocked' })), ['Chitra Iyer']);
  assert.deepEqual(names(run({ status: 'active', sortBy: 'name', sortDir: 'asc' })), ['Ananya Rao', 'bharat Singh', 'Dev Patel']);
});

test('search matches name, email or phone, case-insensitively', () => {
  assert.deepEqual(names(run({ search: 'BHARAT' })), ['bharat Singh']); // name + email
  assert.deepEqual(names(run({ search: 'chitra@x' })), ['Chitra Iyer']); // email
  assert.deepEqual(names(run({ search: '900000001' })).sort(), ['Ananya Rao', 'bharat Singh']); // phone
  assert.deepEqual(run({ search: 'nobody' }), []);
});

test('search text is treated literally, not as a regex', () => {
  assert.deepEqual(run({ search: '.*' }), []); // would match everyone if unescaped
  assert.deepEqual(run({ search: '(' }), []); // would throw if unescaped
  assert.deepEqual(buildMatch({ search: 'a.b' }).$or, [
    { name: { $regex: 'a\\.b', $options: 'i' } },
    { email: { $regex: 'a\\.b', $options: 'i' } },
    { phone: { $regex: 'a\\.b', $options: 'i' } },
  ]);
});

/* ---------------- sort + pagination ---------------- */

test('sorts by a User field (createdAt) both directions', () => {
  assert.deepEqual(names(run({ sortBy: 'createdAt', sortDir: 'desc' })), ['Dev Patel', 'Chitra Iyer', 'bharat Singh', 'Ananya Rao']);
  assert.deepEqual(names(run({ sortBy: 'createdAt', sortDir: 'asc' })), ['Ananya Rao', 'bharat Singh', 'Chitra Iyer', 'Dev Patel']);
});

test('sorts by computed fields (ltv, bookingsCount)', () => {
  assert.equal(run({ sortBy: 'ltv', sortDir: 'desc' })[0].name, 'Ananya Rao');
  assert.deepEqual(run({ sortBy: 'bookingsCount', sortDir: 'desc' }).map((r) => r.bookingsCount), [3, 1, 1, 0]);
});

test('pagination slices the sorted result', () => {
  const p1 = run({ sortBy: 'createdAt', sortDir: 'asc', page: 1, limit: 3 });
  const p2 = run({ sortBy: 'createdAt', sortDir: 'asc', page: 2, limit: 3 });
  assert.equal(p1.length, 3);
  assert.deepEqual(names(p2), ['Dev Patel']);
  assert.deepEqual(run({ page: 9, limit: 3 }), []); // past the end -> empty, not an error
});

test('stats are looked up after paging when sorting by a User field (cheap), before when computed', () => {
  const ops = (q: Partial<ListCustomersQuery>) => buildItemsPipeline({ ...baseQuery, ...q }, COLLECTIONS).map((s) => Object.keys(s)[0]);
  assert.ok(ops({ sortBy: 'name' }).indexOf('$limit') < ops({ sortBy: 'name' }).indexOf('$lookup'));
  assert.ok(ops({ sortBy: 'ltv' }).indexOf('$lookup') < ops({ sortBy: 'ltv' }).indexOf('$sort'));
});

/* ---------------- query validation ---------------- */

test('query defaults', () => {
  assert.deepEqual(listCustomersQuerySchema.parse({}), { sortBy: 'createdAt', sortDir: 'desc', page: 1, limit: 10 });
});

test('query coerces strings and treats empty params as "no filter"', () => {
  const q = listCustomersQuerySchema.parse({ search: '  ana ', status: '', page: '2', limit: '25', sortBy: 'ltv', sortDir: 'asc' });
  assert.equal(q.search, 'ana');
  assert.equal(q.status, undefined);
  assert.equal(q.page, 2);
  assert.equal(q.limit, 25);
});

test('query rejects bad values', () => {
  for (const bad of [{ status: 'deleted' }, { sortBy: 'passwordHash' }, { sortDir: 'up' }, { page: '0' }, { limit: '101' }, { page: 'x' }]) {
    assert.equal(listCustomersQuerySchema.safeParse(bad).success, false, JSON.stringify(bad));
  }
});

/* ---------------- DTO ---------------- */

test('toRow nulls missing phone / lastActivityAt and rounds money to 2 decimals', () => {
  const row = toRow({ _id: 'a', name: 'n', email: 'e', status: 'active', bookingsCount: 1, ltv: 10.1 + 0.2, createdAt: d(1) });
  assert.equal(row.phone, null);
  assert.equal(row.lastActivityAt, null);
  assert.equal(row.ltv, 10.3);
});

/* ---------------- GET /:id mappers ---------------- */

test('toPaymentItem never exposes Razorpay ids or the signature', () => {
  const item = toPaymentItem({
    _id: 'p1', bookingId: 'b1', amount: 499.999, currency: 'INR', status: 'PAID', razorpayOrderId: 'order_x',
    razorpayPaymentId: 'pay_x', razorpaySignature: 'sig', refund: { status: 'processed' }, createdAt: d(1),
  });
  assert.equal(item.amount, 500);
  assert.equal(item.refundStatus, 'processed');
  assert.equal(JSON.stringify(item).includes('order_x'), false);
  assert.equal(JSON.stringify(item).includes('sig'), false);
});

test('toActivityItem resolves the admin name and reads the reason from the audit "after"', () => {
  const names = new Map([['a1', 'Asha Admin']]);
  const row = toActivityItem({ _id: 'x', action: 'CUSTOMER_BLOCKED', actor: 'a1', after: { status: 'blocked', reason: 'Chargeback fraud' }, createdAt: d(2) }, names);
  assert.equal(row.actor, 'Asha Admin');
  assert.equal(row.reason, 'Chargeback fraud');
  assert.equal(toActivityItem({ _id: 'y', action: 'X', actor: 'gone', createdAt: d(2) }, names).actor, 'gone'); // unknown actor falls back to the raw id
  assert.equal(toActivityItem({ _id: 'y', action: 'X', actor: 'gone', createdAt: d(2) }, names).reason, null);
});

/* ---------------- params / body validation ---------------- */

test('customer id param must be a real ObjectId', () => {
  assert.equal(customerIdParamSchema.safeParse({ id: String(new Types.ObjectId()) }).success, true);
  for (const bad of ['', '123', 'not-an-id', '{"$ne":null}']) assert.equal(customerIdParamSchema.safeParse({ id: bad }).success, false, bad);
});

test('status body needs a valid status and a trimmed reason of 3-500 chars', () => {
  assert.deepEqual(updateCustomerStatusSchema.parse({ status: 'blocked', reason: '  Fraud  ' }), { status: 'blocked', reason: 'Fraud' });
  for (const bad of [{ status: 'blocked' }, { status: 'blocked', reason: '  ' }, { status: 'blocked', reason: 'ab' }, { status: 'banned', reason: 'Fraud' }, { status: 'blocked', reason: 'x'.repeat(501) }]) {
    assert.equal(updateCustomerStatusSchema.safeParse(bad).success, false, JSON.stringify(bad));
  }
});

/* ---------------- PATCH /:id/status: block -> status -> revoke sessions -> audit ---------------- */

const CUSTOMER_ID = String(oid());
const ACTOR = { id: 'admin-1', ip: '10.0.0.1' };

/** Swaps repository / audit methods for stubs and restores them after each test. */
function stub(opts: { status?: 'active' | 'blocked' | undefined | null; setStatusResult?: 'ok' | 'race'; auditFails?: boolean; missing?: boolean }) {
  const calls: string[] = [];
  const audits: Record<string, unknown>[] = [];
  const repo = adminCustomersRepository as unknown as Record<string, unknown>;
  const audit = auditService as unknown as Record<string, unknown>;
  const original = { findCustomer: repo.findCustomer, setStatus: repo.setStatus, recordAudit: audit.recordAudit };

  repo.findCustomer = async () => (opts.missing ? null : { _id: CUSTOMER_ID, name: 'Ananya', status: opts.status === null ? undefined : (opts.status ?? 'active') });
  repo.setStatus = async (_id: string, from: string, to: string) => {
    calls.push(`setStatus:${from}->${to}`);
    return opts.setStatusResult === 'race' ? null : { _id: CUSTOMER_ID, status: to };
  };
  audit.recordAudit = async (input: Record<string, unknown>) => {
    calls.push('recordAudit');
    audits.push(input);
    if (opts.auditFails) throw new Error('mongo down');
    return input;
  };
  const restore = () => Object.assign(repo, { findCustomer: original.findCustomer, setStatus: original.setStatus }) && Object.assign(audit, { recordAudit: original.recordAudit });
  return { calls, audits, restore };
}

test('blocking sets the status first, then writes the audit with before/after and the reason', async () => {
  const s = stub({ status: 'active' });
  try {
    const res = await adminCustomersService.updateStatus(CUSTOMER_ID, { status: 'blocked', reason: 'Abusive to partners' }, ACTOR);
    assert.deepEqual(s.calls, ['setStatus:active->blocked', 'recordAudit']);
    assert.deepEqual(res, { id: CUSTOMER_ID, status: 'blocked', previousStatus: 'active', sessionsRevoked: true });
    assert.deepEqual(s.audits[0], {
      actor: 'admin-1', action: 'CUSTOMER_BLOCKED', entity: 'Customer', entityId: CUSTOMER_ID,
      before: { status: 'active' }, after: { status: 'blocked', reason: 'Abusive to partners', sessionsRevoked: true },
      ip: '10.0.0.1', result: 'Success',
    });
  } finally { s.restore(); }
});

test('unblocking audits CUSTOMER_UNBLOCKED and reports no session revoke', async () => {
  const s = stub({ status: 'blocked' });
  try {
    const res = await adminCustomersService.updateStatus(CUSTOMER_ID, { status: 'active', reason: 'Appeal accepted' }, ACTOR);
    assert.equal(res.sessionsRevoked, false);
    assert.equal(s.audits[0].action, 'CUSTOMER_UNBLOCKED');
  } finally { s.restore(); }
});

test('a legacy user with no status field is treated as active', async () => {
  const s = stub({ status: null });
  try {
    assert.equal((await adminCustomersService.updateStatus(CUSTOMER_ID, { status: 'blocked', reason: 'Fraud' }, ACTOR)).previousStatus, 'active');
  } finally { s.restore(); }
});

test('same status again -> 409, nothing written, nothing audited', async () => {
  const s = stub({ status: 'blocked' });
  try {
    await assert.rejects(adminCustomersService.updateStatus(CUSTOMER_ID, { status: 'blocked', reason: 'Fraud' }, ACTOR), { status: 409 });
    assert.deepEqual(s.calls, []);
  } finally { s.restore(); }
});

test('lost race (status changed between read and write) -> 409 and no audit entry', async () => {
  const s = stub({ status: 'active', setStatusResult: 'race' });
  try {
    await assert.rejects(adminCustomersService.updateStatus(CUSTOMER_ID, { status: 'blocked', reason: 'Fraud' }, ACTOR), { status: 409 });
    assert.deepEqual(s.calls, ['setStatus:active->blocked']);
  } finally { s.restore(); }
});

test('unknown / non-customer id -> 404 CUSTOMER_NOT_FOUND', async () => {
  const s = stub({ missing: true });
  try {
    await assert.rejects(adminCustomersService.updateStatus(CUSTOMER_ID, { status: 'blocked', reason: 'Fraud' }, ACTOR), { status: 404, code: 'CUSTOMER_NOT_FOUND' });
    await assert.rejects(adminCustomersService.getById(CUSTOMER_ID), { status: 404, code: 'CUSTOMER_NOT_FOUND' });
  } finally { s.restore(); }
});

test('a failing audit write does not undo the block', async () => {
  const s = stub({ status: 'active', auditFails: true });
  const origError = console.error;
  console.error = () => {};
  try {
    const res = await adminCustomersService.updateStatus(CUSTOMER_ID, { status: 'blocked', reason: 'Fraud' }, ACTOR);
    assert.equal(res.status, 'blocked');
  } finally { console.error = origError; s.restore(); }
});

test('repository: blocking bumps tokenVersion (revokes refresh tokens) in the same update; unblocking does not', async () => {
  const model = UserModel as unknown as { findOneAndUpdate: unknown };
  const original = model.findOneAndUpdate;
  const seen: Array<{ filter: Record<string, unknown>; update: Record<string, unknown> }> = [];
  model.findOneAndUpdate = (filter: Record<string, unknown>, update: Record<string, unknown>) => {
    seen.push({ filter, update });
    return { lean: async () => ({}) };
  };
  try {
    await adminCustomersRepository.setStatus(CUSTOMER_ID, 'active', 'blocked');
    await adminCustomersRepository.setStatus(CUSTOMER_ID, 'blocked', 'active');
  } finally { model.findOneAndUpdate = original; }
  assert.deepEqual(seen[0].update, { $set: { status: 'blocked' }, $inc: { tokenVersion: 1 } });
  assert.deepEqual(seen[0].filter.status, { $ne: 'blocked' }); // legacy docs without a status still match
  assert.deepEqual(seen[1].update, { $set: { status: 'active' } });
  assert.equal(seen[1].filter.status, 'blocked');
  assert.equal(seen[0].filter.role, 'customer'); // can never touch an admin or partner
});
