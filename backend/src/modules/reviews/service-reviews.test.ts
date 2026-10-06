import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import express from 'express';
import { Aggregator } from 'mingo';
import { Types } from 'mongoose';
import { errorHandler } from '../../middleware/error.middleware';
import { ReviewModel } from '../../models/Review';
import { UserModel } from '../../models/User';
import { HttpError } from '../auth/auth.types';
import { reviewsRepository as repo, starCountPipeline, visibleReviewFilter, VISIBLE_REVIEW_SORT, type VisibleReviewRow } from './reviews.repository';
import { reviewsRoutes } from './reviews.routes';
import { ReviewsService, buildSummary, maskAuthor } from './reviews.service';

/* ---------- in-memory stand-in for the repository: runs the repository's REAL filter/sort/pipeline through mingo ---------- */
const oid = () => new Types.ObjectId();
const SVC = oid(), OTHER_SVC = oid(), EMPTY_SVC = oid(), INACTIVE_SVC = oid();
const visibleServices = new Set([String(SVC), String(OTHER_SVC), String(EMPTY_SVC)]);

interface Doc extends VisibleReviewRow { serviceId?: Types.ObjectId; status: string; customerEmail: string; customerId: Types.ObjectId; __v: number }
const T0 = Date.UTC(2026, 8, 1);
let n = 0;
const doc = (over: Partial<Doc>): Doc => ({
  _id: oid(), serviceId: SVC, status: 'approved', rating: 5, message: `Review message number ${(n += 1)} with enough text`, customerName: 'Ravi Kumar',
  customerEmail: `secret${n}@example.com`, customerId: oid(), verified: false, createdAt: new Date(T0 + n * 1000), __v: 0, ...over,
});

const docs: Doc[] = [
  // 5 visible reviews for SVC: ratings 5,5,4,4,2
  doc({ rating: 5, verified: true, customerName: 'Ananya Rao' }),
  doc({ rating: 5, customerName: 'Meera' }),
  doc({ rating: 4, verified: true, customerName: '  Vikram   Singh  ' }),
  doc({ rating: 4 }),
  doc({ rating: 2, customerName: 'Rohit Kumar Verma' }),
  // must never be visible on SVC
  doc({ rating: 1, status: 'pending' }),
  doc({ rating: 1, status: 'rejected' }),
  doc({ rating: 1, serviceId: undefined }), // approved site-wide testimonial, no service
  doc({ rating: 1, serviceId: OTHER_SVC }), // another service's review
];

function install() {
  repo.isServiceVisible = (async (id: string) => visibleServices.has(id)) as never;
  repo.findVisible = (async (id: string, skip: number, limit: number) => {
    const rows = new Aggregator([{ $match: visibleReviewFilter(id) }, { $sort: VISIBLE_REVIEW_SORT }, { $skip: skip }, { $limit: limit }]).run(docs) as unknown as Doc[];
    return rows; // intentionally still carries email/customerId/status/__v: the service layer must strip them
  }) as never;
  repo.starCounts = (async (id: string) => {
    const rows = new Aggregator(starCountPipeline(id)).run(docs) as unknown as { _id: number; count: number }[];
    return new Map(rows.map((r) => [r._id, r.count]));
  }) as never;
}

const app = express();
app.use(reviewsRoutes);
app.use(errorHandler);
let base = '';
let close = () => Promise.resolve();
before(() => {
  install();
  const server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((r) => server.close(() => r()));
});
after(async () => close());

interface Rev { id: string; rating: number; comment: string; author: string; verified: boolean; createdAt: string }
interface Body {
  success: boolean; code?: string; message?: string;
  data: { summary: { average: number; count: number; distribution: Record<string, number> }; reviews: Rev[] };
  meta: { page: number; limit: number; total: number; totalPages: number };
}
const get = async (path: string, headers: Record<string, string> = {}) => {
  const res = await fetch(base + path, { headers });
  return { status: res.status, body: (await res.json()) as Body };
};
const url = (id: Types.ObjectId | string, qs = '') => `/services/${id}/reviews${qs}`;

/* ---------- what is visible ---------- */
test('returns only approved reviews of that service (not pending, rejected, other services or site-wide ones)', async () => {
  const r = await get(url(SVC));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.success, true);
  assert.equal(r.body.data.reviews.length, 5);
  assert.equal(r.body.meta.total, 5);
  assert.ok(r.body.data.reviews.every((x) => x.rating >= 2), 'a rating-1 (hidden) review leaked');
});

test('the other service only sees its own review', async () => {
  const r = await get(url(OTHER_SVC));
  assert.equal(r.body.data.reviews.length, 1);
  assert.equal(r.body.data.summary.count, 1);
});

test('summary: count, one-decimal average and a zero-filled distribution with all five stars', async () => {
  const { summary } = (await get(url(SVC))).body.data;
  assert.deepEqual(summary.distribution, { 5: 2, 4: 2, 3: 0, 2: 1, 1: 0 });
  assert.equal(summary.count, 5);
  assert.equal(summary.average, 4); // (5+5+4+4+2)/5 = 4.0
});

test('a service with no visible reviews: 200, empty list, zeroed summary (not an error)', async () => {
  const r = await get(url(EMPTY_SVC));
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.data.reviews, []);
  assert.deepEqual(r.body.data.summary, { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  assert.deepEqual(r.body.meta, { page: 1, limit: 10, total: 0, totalPages: 0 });
});

/* ---------- privacy + shape ---------- */
test('each review exposes only id, rating, comment, author, verified, createdAt (no email, customer id or status)', async () => {
  const { reviews } = (await get(url(SVC))).body.data;
  for (const rev of reviews) assert.deepEqual(Object.keys(rev).sort(), ['author', 'comment', 'createdAt', 'id', 'rating', 'verified']);
  const text = JSON.stringify(reviews);
  assert.ok(!text.includes('@example.com'), 'email leaked');
  assert.ok(!text.includes('customerId') && !text.includes('status'));
});

test('author is masked to first name + last initial; verified is a real boolean', async () => {
  const { reviews } = (await get(url(SVC, '?limit=50'))).body.data;
  const authors = new Set(reviews.map((r) => r.author));
  assert.ok(authors.has('Ananya R.') && authors.has('Meera') && authors.has('Vikram S.') && authors.has('Rohit V.'), [...authors].join('|'));
  assert.ok(reviews.every((r) => typeof r.verified === 'boolean'));
  assert.equal(reviews.filter((r) => r.verified).length, 2);
});

test('maskAuthor edge cases', () => {
  assert.equal(maskAuthor('Ravi Kumar'), 'Ravi K.');
  assert.equal(maskAuthor('ravi  kumar  verma'), 'ravi V.');
  assert.equal(maskAuthor('Meera'), 'Meera');
  assert.equal(maskAuthor('   '), 'Customer');
  assert.equal(maskAuthor('anil k'), 'anil K.');
});

test('buildSummary rounds the average to one decimal', () => {
  assert.equal(buildSummary(new Map([[5, 1], [4, 2]])).average, 4.3); // 13/3 = 4.333
  assert.equal(buildSummary(new Map([[5, 2], [4, 1]])).average, 4.7); // 14/3 = 4.666
  assert.equal(buildSummary(new Map()).average, 0);
});

/* ---------- order + pagination ---------- */
test('newest first', async () => {
  const { reviews } = (await get(url(SVC))).body.data;
  const times = reviews.map((r) => Date.parse(r.createdAt));
  assert.deepEqual(times, [...times].sort((a, b) => b - a));
});

test('pagination: limit 2 gives pages of 2, 2, 1 with no overlap, then an empty page past the end', async () => {
  const p1 = await get(url(SVC, '?limit=2&page=1'));
  const p2 = await get(url(SVC, '?limit=2&page=2'));
  const p3 = await get(url(SVC, '?limit=2&page=3'));
  const p4 = await get(url(SVC, '?limit=2&page=4'));
  assert.deepEqual([p1, p2, p3].map((p) => p.body.data.reviews.length), [2, 2, 1]);
  assert.deepEqual(p1.body.meta, { page: 1, limit: 2, total: 5, totalPages: 3 });
  const ids = [p1, p2, p3].flatMap((p) => p.body.data.reviews.map((r) => r.id));
  assert.equal(new Set(ids).size, 5, 'a review appeared on two pages');
  assert.equal(p4.status, 200);
  assert.deepEqual(p4.body.data.reviews, []);
  assert.equal(p4.body.meta.total, 5);
});

test('distribution stays for the whole visible set on every page (not just the current page)', async () => {
  const p2 = await get(url(SVC, '?limit=2&page=2'));
  assert.equal(p2.body.data.summary.count, 5);
});

test('reviews with identical timestamps still page deterministically (_id tiebreak)', async () => {
  const same = new Date(T0 + 99_000);
  const tied = [doc({ serviceId: EMPTY_SVC, createdAt: same }), doc({ serviceId: EMPTY_SVC, createdAt: same }), doc({ serviceId: EMPTY_SVC, createdAt: same })];
  docs.push(...tied);
  try {
    const a = [...(await get(url(EMPTY_SVC, '?limit=1&page=1'))).body.data.reviews, ...(await get(url(EMPTY_SVC, '?limit=1&page=2'))).body.data.reviews, ...(await get(url(EMPTY_SVC, '?limit=1&page=3'))).body.data.reviews];
    assert.equal(new Set(a.map((r) => r.id)).size, 3);
  } finally {
    docs.splice(docs.length - 3, 3);
  }
});

/* ---------- 404 / validation / public access ---------- */
test('unknown service id -> 404 NOT_FOUND', async () => {
  const r = await get(url(oid()));
  assert.equal(r.status, 404);
  assert.equal(r.body.success, false);
  assert.equal(r.body.code, 'NOT_FOUND');
});

test('inactive service -> 404 (even if it has approved reviews)', async () => {
  docs.push(doc({ serviceId: INACTIVE_SVC }));
  try {
    assert.equal((await get(url(INACTIVE_SVC))).status, 404);
  } finally {
    docs.pop();
  }
});

const invalid: [string, string][] = [
  ['non-id service id', '/services/not-an-id/reviews'],
  ['operator-looking service id', '/services/%24ne/reviews'],
  ['short hex id', '/services/abc123/reviews'],
  ['limit zero', url(SVC, '?limit=0')],
  ['limit above 50', url(SVC, '?limit=51')],
  ['limit not a number', url(SVC, '?limit=abc')],
  ['limit decimal', url(SVC, '?limit=2.5')],
  ['page zero', url(SVC, '?page=0')],
  ['page negative', url(SVC, '?page=-1')],
  ['page absurdly large', url(SVC, '?page=99999999')],
  ['unknown param', url(SVC, '?foo=bar')],
  ['repeated param (array)', url(SVC, '?page=1&page=2')],
  ['mongo operator injection', url(SVC, '?page[$gt]=0')],
];
for (const [name, path] of invalid) {
  test(`GET reviews ${name} -> 400 VALIDATION_ERROR`, async () => {
    const r = await get(path);
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal(r.body.code, 'VALIDATION_ERROR');
    assert.equal(r.body.success, false);
  });
}

test('blank page/limit fall back to defaults instead of erroring', async () => {
  const r = await get(url(SVC, '?page=&limit='));
  assert.equal(r.status, 200);
  assert.deepEqual([r.body.meta.page, r.body.meta.limit], [1, 10]);
});

test('public: works with no token, with a customer-style token, and ignores a garbage token', async () => {
  assert.equal((await get(url(SVC))).status, 200);
  assert.equal((await get(url(SVC), { Authorization: 'Bearer some.customer.token' })).status, 200);
  assert.equal((await get(url(SVC), { Authorization: 'Bearer garbage' })).status, 200);
});

/* ---------- POST /reviews linking: serviceId / bookingId / verified ---------- */
const CUSTOMER = oid();
const BOOKING = oid();
let created: Record<string, unknown> | null = null;
const origFindById = UserModel.findById;
const origCreate = ReviewModel.create;
const origFindBooking = repo.findBookingForReview;
const setBooking = (b: { customerId: Types.ObjectId; serviceId?: Types.ObjectId; status: string } | null) => {
  repo.findBookingForReview = (async () => b) as never;
};
const MSG = 'A perfectly valid review message that is long enough.';
const svc = new ReviewsService();
const create = (input: Record<string, unknown>) => svc.createReview(String(CUSTOMER), { rating: 5, message: MSG, ...input });

before(() => {
  UserModel.findById = (() => ({ select: () => ({ lean: async () => ({ _id: CUSTOMER, name: 'Test Customer', email: 'c@example.com' }) }) })) as never;
  ReviewModel.create = (async (d: Record<string, unknown>) => { created = d; return { toObject: () => d }; }) as never;
});
after(() => {
  UserModel.findById = origFindById;
  ReviewModel.create = origCreate;
  repo.findBookingForReview = origFindBooking;
});

test('POST /reviews without a service stays a site-wide testimonial (no serviceId, not verified)', async () => {
  await create({});
  assert.ok(created);
  assert.equal(created.serviceId, undefined);
  assert.equal(created.verified, undefined);
});

test('serviceId without a booking is stored but never verified', async () => {
  await create({ serviceId: String(SVC) });
  assert.equal(String(created?.serviceId), String(SVC));
  assert.equal(created?.verified, false);
  assert.equal(created?.bookingId, undefined);
});

test('own completed booking of that service -> verified true and linked', async () => {
  for (const status of ['completed', 'rated']) {
    setBooking({ customerId: CUSTOMER, serviceId: SVC, status });
    await create({ serviceId: String(SVC), bookingId: String(BOOKING) });
    assert.equal(created?.verified, true, status);
    assert.equal(String(created?.bookingId), String(BOOKING));
  }
});

test('the client can never set verified (extra body fields are ignored)', async () => {
  await create({ serviceId: String(SVC), verified: true, status: 'approved' });
  assert.equal(created?.verified, false);
  assert.equal(created?.status, undefined);
});

test('someone else\'s booking and a missing booking are both 404 (ids cannot be probed)', async () => {
  setBooking({ customerId: oid(), serviceId: SVC, status: 'completed' });
  await assert.rejects(create({ serviceId: String(SVC), bookingId: String(BOOKING) }), (e: HttpError) => e.status === 404);
  setBooking(null);
  await assert.rejects(create({ serviceId: String(SVC), bookingId: String(BOOKING) }), (e: HttpError) => e.status === 404);
});

test('booking for a different service -> 400; booking not finished yet -> 409', async () => {
  setBooking({ customerId: CUSTOMER, serviceId: OTHER_SVC, status: 'completed' });
  await assert.rejects(create({ serviceId: String(SVC), bookingId: String(BOOKING) }), (e: HttpError) => e.status === 400);
  for (const status of ['confirmed', 'assigned', 'in_progress', 'cancelled_by_customer']) {
    setBooking({ customerId: CUSTOMER, serviceId: SVC, status });
    await assert.rejects(create({ serviceId: String(SVC), bookingId: String(BOOKING) }), (e: HttpError) => e.status === 409, status);
  }
});

test('reviewing the same booking twice -> 409 (unique bookingId index)', async () => {
  setBooking({ customerId: CUSTOMER, serviceId: SVC, status: 'completed' });
  ReviewModel.create = (async () => { throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 }); }) as never;
  try {
    await assert.rejects(create({ serviceId: String(SVC), bookingId: String(BOOKING) }), (e: HttpError) => e.status === 409);
  } finally {
    ReviewModel.create = (async (d: Record<string, unknown>) => { created = d; return { toObject: () => d }; }) as never;
  }
});

test('POST /reviews validation: bookingId needs serviceId; ids must be valid', async () => {
  await assert.rejects(create({ bookingId: String(BOOKING) }), (e: HttpError) => e.status === 400);
  await assert.rejects(create({ serviceId: 'nope' }), (e: HttpError) => e.status === 400);
  await assert.rejects(create({ serviceId: String(SVC), bookingId: '$ne' }), (e: HttpError) => e.status === 400);
});
