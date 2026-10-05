import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Aggregator } from 'mingo';
import { Types } from 'mongoose';
import { errorHandler } from '../../middleware/error.middleware';
import { addressesService } from '../addresses/addresses.service';
import {
  buildBookingsPipeline,
  buildCategoriesPipeline,
  buildRecommendedPipeline,
  customerDashboardRepository as repo,
  type CollectionNames,
} from './customer-dashboard.repository';
import { customerDashboardRoutes } from './customer-dashboard.routes';
import { customerDashboardService, firstName, progressStep, shortPartnerName } from './customer-dashboard.service';
import type { BookingRow, BookingsFacet, CategoryRow, ServiceRow } from './customer-dashboard.types';

/* ------------------------------------------------------------------ */
/* Seed data: two customers (A, B), one partner, catalog              */
/* ------------------------------------------------------------------ */

const oid = () => new Types.ObjectId();
const A = oid();
const B = oid();
const NEW_USER = oid();
const PARTNER_USER = oid();
const PARTNER = oid();
const CAT_CLEAN = oid();
const CAT_SPA = oid();
const CAT_OFF = oid();

const COLLECTIONS: CollectionNames = { partners: 'partners', users: 'users', services: 'services' };
const day = (n: number) => new Date(Date.UTC(2026, 8, 30 + n, 9, 0, 0));

const users = [
  { _id: A, name: 'Ananya Rao', role: 'customer' },
  { _id: B, name: 'Bharat Singh', role: 'customer' },
  { _id: NEW_USER, name: 'Nisha Verma', role: 'customer' },
  { _id: PARTNER_USER, name: 'Ramesh Kumar', role: 'partner' },
];
const partners = [{ _id: PARTNER, userId: PARTNER_USER }];

function booking(customerId: Types.ObjectId, status: string, extra: Record<string, unknown> = {}) {
  return {
    _id: oid(),
    customerId,
    partnerId: null,
    categoryId: CAT_CLEAN,
    serviceName: 'Deep Home Cleaning',
    customerName: 'PRIVATE customer name',
    status,
    scheduledAt: day(1),
    updatedAt: day(0),
    address: { line1: 'Flat 302', area: 'Kukatpally', city: 'Hyderabad', pincode: '500072' },
    priceBreakdown: { base: 1200, tax: 100, total: 1499 },
    partnerEarning: 900,
    otpCodes: { start: '1111', end: '2222' },
    offers: [{ partnerId: PARTNER, response: 'pending' }],
    statusHistory: [{ to: status, actorRole: 'system' }],
    ...extra,
  };
}

const aLive = booking(A, 'in_progress', { partnerId: PARTNER, serviceName: 'AC Service', updatedAt: day(0) });
const aLive2 = booking(A, 'en_route', { partnerId: PARTNER, serviceName: 'Plumbing', updatedAt: new Date(day(0).getTime() - 60_000) });
const aUpLate = booking(A, 'assigned', { scheduledAt: day(5), serviceName: 'Late one' });
const aUpSoon = booking(A, 'searching_for_partner', { scheduledAt: day(2), serviceName: 'Soon one' });
const aUpNew = booking(A, 'created', { scheduledAt: day(3), serviceName: 'Middle one' });
const aDone = booking(A, 'completed');
const aCancelled = booking(A, 'cancelled_by_customer');
const bLive = booking(B, 'in_progress', { serviceName: "B's secret job" });
const bUp = booking(B, 'assigned', { serviceName: "B's upcoming" });
const bookings = [aLive, aLive2, aUpLate, aUpSoon, aUpNew, aDone, aCancelled, bLive, bUp];

const categories = [
  { _id: CAT_SPA, name: 'Salon & Spa', slug: 'salon-spa', icon: '💆', sortOrder: 2, active: true },
  { _id: CAT_CLEAN, name: 'Home Cleaning', slug: 'home-cleaning', icon: '🧹', sortOrder: 1, active: true },
  { _id: CAT_OFF, name: 'Hidden', slug: 'hidden', icon: '🙈', sortOrder: 0, active: false },
];
const svc = (name: string, categoryId: Types.ObjectId, bookingsCount: number, ratingAvg: number, active = true) => ({
  _id: oid(),
  name,
  slug: name.toLowerCase().replace(/\W+/g, '-'),
  categoryId,
  icon: '🛠',
  basePrice: 499,
  durationMinutes: 60,
  ratingAvg,
  ratingCount: 10,
  bookingsCount,
  active,
  internalCostPrice: 123, // must never be returned
});
const services = [
  svc('Deep Cleaning', CAT_CLEAN, 900, 4.8),
  svc('Sofa Shampoo', CAT_CLEAN, 500, 4.7),
  svc('Spa', CAT_SPA, 300, 4.9),
  svc('Facial', CAT_SPA, 200, 4.5),
  svc('Haircut', CAT_SPA, 150, 4.4),
  svc('Sixth service', CAT_SPA, 100, 4.0),
  svc('Discontinued', CAT_CLEAN, 5000, 5, false),
];

const collections: Record<string, Record<string, unknown>[]> = { users, partners, services, bookings, categories };
const run = <T>(pipeline: object[], docs: unknown[]): T[] =>
  new Aggregator(pipeline as never, { collectionResolver: (n: string) => collections[n] ?? [] }).run(docs as never) as T[];

/** Installs a fake repository that runs the REAL pipelines against the seed data. */
function useSeededRepo() {
  const notifications = [
    { userId: A, readAt: null },
    { userId: A, readAt: null },
    { userId: A, readAt: day(0) },
    { userId: B, readAt: null },
  ];
  const calls: { fn: string; id?: string }[] = [];
  repo.findCustomerName = async (id) => {
    calls.push({ fn: 'findCustomerName', id: id.toString() });
    const u = users.find((x) => x._id.equals(id));
    return u ? { name: u.name } : null;
  };
  repo.bookings = async (id) => {
    calls.push({ fn: 'bookings', id: id.toString() });
    const [row] = run<BookingsFacet>(buildBookingsPipeline(id, COLLECTIONS), bookings);
    return row ?? { active: [], upcoming: [], total: 0 };
  };
  addressesService.getDefault = async (id) => {
    calls.push({ fn: 'defaultAddress', id });
    return A.equals(id)
      ? { id: oid().toString(), label: 'Home', line1: 'Flat 302', line2: 'Kukatpally', city: 'Hyderabad', state: 'Telangana', pincode: '500072', isDefault: true, serviceable: true }
      : null;
  };
  repo.categories = async () => run<CategoryRow>(buildCategoriesPipeline(COLLECTIONS), categories);
  repo.recommendedServices = async () => run<ServiceRow>(buildRecommendedPipeline(), services);
  repo.unreadNotifications = async (id) => {
    calls.push({ fn: 'unreadNotifications', id: id.toString() });
    return notifications.filter((n) => n.userId.equals(id) && n.readAt === null).length;
  };
  return calls;
}

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

/* ------------------------------------------------------------------ */
/* 1. Pure mappers                                                    */
/* ------------------------------------------------------------------ */

test('firstName / shortPartnerName never expose a full partner name', () => {
  assert.equal(firstName('  Ananya  Rao '), 'Ananya');
  assert.equal(shortPartnerName('Ramesh Kumar'), 'Ramesh K.');
  assert.equal(shortPartnerName('Kiran'), 'Kiran');
  assert.equal(shortPartnerName('Mary Ann de Souza'), 'Mary S.');
  assert.equal(shortPartnerName(undefined), null);
  assert.equal(shortPartnerName('   '), null);
});

test('progressStep maps live statuses to 2/3/4 bars and everything else to 0', () => {
  assert.equal(progressStep('en_route'), 2);
  assert.equal(progressStep('arrived'), 3);
  assert.equal(progressStep('in_progress'), 4);
  assert.equal(progressStep('assigned'), 0);
});

/* ------------------------------------------------------------------ */
/* 2. The aggregation pipelines, executed against seed data           */
/* ------------------------------------------------------------------ */

test('bookings pipeline: first stage isolates the customer', () => {
  const pipeline = buildBookingsPipeline(A, COLLECTIONS);
  assert.deepEqual(pipeline[0], { $match: { customerId: A } });
});

test("bookings pipeline: customer A only ever gets A's bookings", () => {
  const [row] = run<BookingsFacet>(buildBookingsPipeline(A, COLLECTIONS), bookings);
  const returned = [...row.active, ...row.upcoming].map((b) => b._id.toString());
  const bIds = [bLive, bUp].map((b) => b._id.toString());
  assert.ok(returned.length > 0);
  for (const id of bIds) assert.ok(!returned.includes(id), 'leaked a booking that belongs to customer B');
  assert.equal(row.total, 7); // all of A's bookings, none of B's
});

test('bookings pipeline: live vs upcoming split, ordering and partner name lookup', () => {
  const [row] = run<BookingsFacet>(buildBookingsPipeline(A, COLLECTIONS), bookings);
  assert.deepEqual(
    row.active.map((b) => b.status),
    ['in_progress', 'en_route'], // most recently updated first
  );
  assert.deepEqual(
    row.upcoming.map((b) => b.serviceName),
    ['Soon one', 'Middle one', 'Late one'], // soonest first; created/searching/assigned all count
  );
  assert.equal(row.active[0].partnerName, 'Ramesh Kumar'); // raw name; the service shortens it
  assert.equal(row.upcoming[0].partnerName ?? null, null); // no partner yet
});

test('bookings pipeline: projection is a whitelist — no secrets, no other people', () => {
  const [row] = run<BookingsFacet>(buildBookingsPipeline(A, COLLECTIONS), bookings);
  const forbidden = ['otpCodes', 'offers', 'statusHistory', 'partnerEarning', 'partnerId', 'customerId', 'customerName', 'partner', 'partnerUser'];
  for (const b of [...row.active, ...row.upcoming]) {
    for (const key of forbidden) assert.ok(!(key in b), `booking leaked field "${key}"`);
    assert.ok(!('pincode' in b.address));
  }
});

test('bookings pipeline: a customer with no bookings gets an empty result, not B\'s data', () => {
  const rows = run<BookingsFacet>(buildBookingsPipeline(NEW_USER, COLLECTIONS), bookings);
  const row = rows[0] ?? { active: [], upcoming: [], total: 0 };
  assert.deepEqual(row.active, []);
  assert.deepEqual(row.upcoming, []);
  assert.equal(row.total, 0);
});

test('bookings pipeline: each section is capped at 5', () => {
  const many = Array.from({ length: 9 }, (_, i) => booking(A, 'assigned', { scheduledAt: day(10 + i) }));
  const [row] = run<BookingsFacet>(buildBookingsPipeline(A, COLLECTIONS), many);
  assert.equal(row.upcoming.length, 5);
  assert.equal(row.total, 9);
});

test('categories pipeline: active only, sorted, with live service counts', () => {
  const rows = run<CategoryRow>(buildCategoriesPipeline(COLLECTIONS), categories);
  assert.deepEqual(rows.map((r) => r.name), ['Home Cleaning', 'Salon & Spa']);
  assert.equal(rows[0].serviceCount, 2); // inactive "Discontinued" is not counted
  assert.equal(rows[1].serviceCount, 4);
});

test('recommended pipeline: top 5 active by popularity, whitelisted fields only', () => {
  const rows = run<ServiceRow & Record<string, unknown>>(buildRecommendedPipeline(), services);
  assert.deepEqual(rows.map((r) => r.name), ['Deep Cleaning', 'Sofa Shampoo', 'Spa', 'Facial', 'Haircut']);
  for (const r of rows) {
    assert.ok(!('internalCostPrice' in r));
    assert.ok(!('bookingsCount' in r));
  }
});

/* ------------------------------------------------------------------ */
/* 3. Service                                                         */
/* ------------------------------------------------------------------ */

test('service: builds the full dashboard for customer A', async () => {
  useSeededRepo();
  const d = await customerDashboardService.getDashboard(A.toString());
  assert.deepEqual(d.greeting, { name: 'Ananya Rao', firstName: 'Ananya' });
  assert.equal(d.isNewCustomer, false);
  assert.equal(d.defaultAddress?.label, 'Home');
  assert.deepEqual(d.activeBookings.map((b) => b.serviceName), ['AC Service', 'Plumbing']);
  assert.equal(d.activeBookings[0].partnerName, 'Ramesh K.');
  assert.equal(d.activeBookings[0].progressStep, 4);
  assert.equal(d.activeBookings[0].total, 1499);
  assert.equal(d.upcomingBookings.length, 3);
  assert.deepEqual(d.categories.map((c) => c.name), ['Home Cleaning', 'Salon & Spa']);
  assert.equal(d.recommendedServices.length, 5);
  assert.equal(d.recommendedServices[0].price, 499);
  assert.equal(d.unreadNotifications, 2); // B's unread one is not counted
  const json = JSON.stringify(d);
  for (const secret of ['1111', '2222', 'PRIVATE customer name', "B's secret job", 'otpCodes', 'internalCostPrice']) {
    assert.ok(!json.includes(secret), `response leaked "${secret}"`);
  }
});

test("service: every repository call uses the token's user id and nothing else", async () => {
  const calls = useSeededRepo();
  await customerDashboardService.getDashboard(A.toString());
  const scoped = calls.filter((c) => c.id !== undefined);
  assert.ok(scoped.length >= 4);
  for (const c of scoped) assert.equal(c.id, A.toString(), `${c.fn} was called with another user's id`);
});

test('service: a customer with no bookings is flagged as new (empty state)', async () => {
  useSeededRepo();
  const d = await customerDashboardService.getDashboard(NEW_USER.toString());
  assert.equal(d.isNewCustomer, true);
  assert.deepEqual(d.activeBookings, []);
  assert.deepEqual(d.upcomingBookings, []);
  assert.equal(d.defaultAddress, null);
  assert.equal(d.unreadNotifications, 0);
  assert.ok(d.categories.length > 0); // catalog still shown so they can start booking
});

test("service: asking for someone else's dashboard is 403 and touches no data", async () => {
  const calls = useSeededRepo();
  await assert.rejects(() => customerDashboardService.getDashboard(A.toString(), B.toString()), { status: 403, code: 'RESOURCE_FORBIDDEN' });
  assert.equal(calls.length, 0);
});

test('service: own id in customerId is allowed; unknown user is 404; bad token id is 401', async () => {
  useSeededRepo();
  const d = await customerDashboardService.getDashboard(A.toString(), A.toString());
  assert.equal(d.greeting.firstName, 'Ananya');
  await assert.rejects(() => customerDashboardService.getDashboard(oid().toString()), { status: 404 });
  await assert.rejects(() => customerDashboardService.getDashboard('not-an-id'), { status: 401 });
});

/* ------------------------------------------------------------------ */
/* 4. HTTP: real auth + role + validation middleware                  */
/* ------------------------------------------------------------------ */

let base = '';
let close: () => Promise<void> = async () => undefined;
const secret = process.env.JWT_SECRET || 'dev_access_secret_change_me';
const token = (sub: string, role: string) => jwt.sign({ sub, role }, secret, { expiresIn: '5m' });
const get = async (path: string, bearer?: string) => {
  const res = await fetch(`${base}/api/v1/customer/dashboard${path}`, { headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} });
  return { status: res.status, headers: res.headers, body: (await res.json()) as Record<string, unknown> & { data?: Record<string, unknown> } };
};

before(async () => {
  useSeededRepo();
  const app = express();
  app.use('/api/v1/customer/dashboard', customerDashboardRoutes);
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((r) => server.close(() => r()));
});
after(async () => close());

test('HTTP 200: customer A sees A\'s data, envelope + no-store header', async () => {
  const r = await get('', token(A.toString(), 'customer'));
  assert.equal(r.status, 200);
  assert.equal(r.body.success, true);
  assert.equal(r.headers.get('cache-control'), 'private, no-store');
  const names = (r.body.data?.activeBookings as { serviceName: string }[]).map((b) => b.serviceName);
  assert.deepEqual(names, ['AC Service', 'Plumbing']);
  assert.ok(!JSON.stringify(r.body).includes("B's secret job"));
});

test("HTTP 200: customer B gets B's data, never A's", async () => {
  const r = await get('', token(B.toString(), 'customer'));
  assert.equal(r.status, 200);
  const active = r.body.data?.activeBookings as { serviceName: string }[];
  assert.deepEqual(active.map((b) => b.serviceName), ["B's secret job"]);
  assert.ok(!JSON.stringify(r.body).includes('AC Service'));
  assert.equal(r.body.data?.unreadNotifications, 1);
});

test('HTTP 401: no token / garbage token', async () => {
  const none = await get('');
  assert.equal(none.status, 401);
  assert.equal(none.body.code, 'UNAUTHENTICATED');
  const bad = await get('', 'garbage.token.here');
  assert.equal(bad.status, 401);
  assert.equal(bad.body.code, 'INVALID_ACCESS_TOKEN');
});

test('HTTP 403: wrong role (partner, admin)', async () => {
  for (const role of ['partner', 'admin']) {
    const r = await get('', token(PARTNER_USER.toString(), role));
    assert.equal(r.status, 403, role);
    assert.equal(r.body.code, 'FORBIDDEN');
  }
});

test("HTTP 403: customer A asking for B's id", async () => {
  const r = await get(`?customerId=${B.toString()}`, token(A.toString(), 'customer'));
  assert.equal(r.status, 403);
  assert.equal(r.body.code, 'RESOURCE_FORBIDDEN');
  assert.ok(!JSON.stringify(r.body).includes("B's"));
});

test('HTTP 400: malformed customerId and unknown query params', async () => {
  const badId = await get('?customerId=123', token(A.toString(), 'customer'));
  assert.equal(badId.status, 400);
  assert.equal(badId.body.code, 'VALIDATION_ERROR');
  const extra = await get('?role=admin', token(A.toString(), 'customer'));
  assert.equal(extra.status, 400);
});

test('HTTP 200: customerId equal to the caller is accepted', async () => {
  const r = await get(`?customerId=${A.toString()}`, token(A.toString(), 'customer'));
  assert.equal(r.status, 200);
});
