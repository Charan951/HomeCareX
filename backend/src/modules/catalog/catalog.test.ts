import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import express from 'express';
import { Aggregator } from 'mingo';
import { Types } from 'mongoose';
import { errorHandler } from '../../middleware/error.middleware';
import { catalogRepository as repo, type CategoryRow, type ServiceRow } from './catalog.repository';
import { catalogRoutes } from './catalog.routes';
import { buildServiceQuery } from './catalog.query';
import { serviceQuerySchema } from './catalog.validation';

/* ---------- in-memory stand-in for the repository (same filter/sort/skip/limit semantics via mingo) ---------- */
const oid = () => new Types.ObjectId();
const CLEAN = oid(), REPAIR = oid(), HIDDEN = oid();
const categories: (CategoryRow & { active: boolean })[] = [
  { _id: REPAIR, name: 'Appliance Repair', slug: 'appliance-repair', sortOrder: 2, active: true },
  { _id: CLEAN, name: 'Home Cleaning', slug: 'home-cleaning', sortOrder: 1, active: true },
  { _id: HIDDEN, name: 'Hidden', slug: 'hidden', sortOrder: 0, active: false },
];
type Doc = ServiceRow & { active: boolean; bookingsCount: number; createdAt: Date; __v: number };
const docs: Doc[] = [];
for (let i = 1; i <= 30; i++) {
  docs.push({
    _id: oid(), slug: `svc-${i}`, name: i === 5 ? 'AC Repair Special' : `Service ${i}`, description: i === 5 ? 'Fix any AC' : `Description ${i}`,
    categoryId: i <= 12 ? CLEAN : i <= 28 ? REPAIR : HIDDEN, basePrice: 100 * i, durationMinutes: 30 + (i % 4) * 30,
    ratingAvg: 3 + (i % 5) / 2, ratingCount: 10 * i, bookingsCount: i * 3, active: i !== 7, availability: i % 3 === 0 ? 'today' : i % 3 === 1 ? 'tomorrow' : 'scheduled',
    createdAt: new Date(2026, 0, i), __v: 0,
  });
}

function install() {
  repo.activeCategories = (async () => categories.filter((c) => c.active).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))) as never;
  repo.activeServiceStats = (async () => {
    const m = new Map<string, { count: number; fromPrice: number; bookings: number }>();
    for (const d of docs.filter((x) => x.active)) {
      const k = String(d.categoryId);
      const cur = m.get(k) ?? { count: 0, fromPrice: Infinity, bookings: 0 };
      m.set(k, { count: cur.count + 1, fromPrice: Math.min(cur.fromPrice, d.basePrice), bookings: cur.bookings + d.bookingsCount });
    }
    return m;
  }) as never;
  const match = (filter: Record<string, unknown>) => {
    const { $text, ...rest } = filter as { $text?: { $search: string } } & Record<string, unknown>;
    let rows = new Aggregator([{ $match: rest }]).run(docs) as unknown as Doc[];
    if ($text) {
      const terms = $text.$search.toLowerCase().split(/\s+/);
      rows = rows.filter((d) => terms.some((t) => `${d.name} ${d.description}`.toLowerCase().includes(t)));
    }
    return rows;
  };
  repo.findServices = (async (built: { filter: Record<string, unknown>; sort: Record<string, 1 | -1> }, skip: number, limit: number) => {
    const rows = match(built.filter);
    const sorted = new Aggregator([{ $sort: built.sort }, { $skip: skip }, { $limit: limit }]).run(rows) as unknown as Doc[];
    return sorted; // intentionally still carries active/bookingsCount/__v: the service layer must strip them
  }) as never;
  repo.countServices = (async (built: { filter: Record<string, unknown> }) => match(built.filter).length) as never;
  repo.findService = (async (idOrSlug: string) => docs.find((d) => d.active && (String(d._id) === idOrSlug || d.slug === idOrSlug)) ?? null) as never;
}

const app = express();
app.use(catalogRoutes);
app.use(errorHandler);
let base = '';
let close = () => Promise.resolve();
before(async () => {
  install();
  const server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((r) => server.close(() => r()));
});
after(async () => close());

interface Svc {
  id: string; slug: string; basePrice: number; durationMinutes: number; rating: number; availability: string;
  category: Record<string, string>;
}
interface Cat { slug: string; serviceCount: number; fromPrice: number; popular: boolean }
interface Body<T> {
  success: boolean; code?: string; details?: unknown[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  data: T;
}
const get = async <T = Svc[]>(path: string) => {
  const res = await fetch(base + path);
  return { status: res.status, body: (await res.json()) as Body<T> };
};

/* ---------- validation: every param ---------- */
const invalid: [string, string][] = [
  ['limit above 50', '?limit=51'],
  ['limit zero', '?limit=0'],
  ['limit negative', '?limit=-5'],
  ['limit not a number', '?limit=abc'],
  ['limit decimal', '?limit=2.5'],
  ['page zero', '?page=0'],
  ['page negative', '?page=-1'],
  ['page not a number', '?page=abc'],
  ['page absurdly large', '?page=99999999'],
  ['rating above 5', '?rating=6'],
  ['rating negative', '?rating=-1'],
  ['rating not a number', '?rating=high'],
  ['minPrice negative', '?minPrice=-10'],
  ['maxPrice not a number', '?maxPrice=cheap'],
  ['minPrice greater than maxPrice', '?minPrice=500&maxPrice=100'],
  ['duration too small', '?duration=1'],
  ['duration decimal', '?duration=30.5'],
  ['availability unknown', '?availability=yesterday'],
  ['availability "scheduled" is not a filter', '?availability=scheduled'],
  ['sort unknown', '?sort=cheapest'],
  ['category with illegal characters', '?category=%24ne'],
  ['q too long', `?q=${'a'.repeat(61)}`],
  ['unknown param', '?foo=bar'],
  ['repeated param (array)', '?q=a&q=b'],
  ['mongo operator injection', '?minPrice[$gt]=0'],
];
for (const [name, qs] of invalid) {
  test(`GET /services ${name} -> 400 VALIDATION_ERROR`, async () => {
    const r = await get(`/services${qs}`);
    assert.equal(r.status, 400, JSON.stringify(r.body));
    assert.equal(r.body.success, false);
    assert.equal(r.body.code, 'VALIDATION_ERROR');
    assert.ok(Array.isArray(r.body.details) && r.body.details.length > 0);
  });
}

test('GET /categories rejects any query param -> 400', async () => {
  assert.equal((await get('/categories?x=1')).status, 400);
});

test('blank params are treated as not sent (a cleared search box never errors)', async () => {
  const r = await get('/services?q=&category=&rating=&minPrice=&maxPrice=&duration=&availability=&sort=');
  assert.equal(r.status, 200);
});

test('defaults: page 1, limit 12, boundary values accepted', async () => {
  const d = serviceQuerySchema.parse({});
  assert.equal(d.page, 1);
  assert.equal(d.limit, 12);
  assert.equal((await get('/services?limit=50')).status, 200);
  assert.equal((await get('/services?limit=1&page=1')).status, 200);
  assert.equal((await get('/services?rating=0&rating=0')).status, 400); // repeated
  assert.equal((await get('/services?rating=5&minPrice=0&maxPrice=1000000&duration=1440')).status, 200);
});

/* ---------- pagination bounds ---------- */
test('pagination: meta is correct and pages do not overlap', async () => {
  const p1 = await get('/services?limit=10&page=1&sort=price-asc');
  const p2 = await get('/services?limit=10&page=2&sort=price-asc');
  const p3 = await get('/services?limit=10&page=3&sort=price-asc');
  assert.deepEqual(p1.body.meta, { page: 1, limit: 10, total: 27, totalPages: 3 }); // 28 in active cats minus 1 inactive
  assert.equal(p1.body.data.length, 10);
  assert.equal(p3.body.data.length, 7);
  const ids = [...p1.body.data, ...p2.body.data, ...p3.body.data].map((s: { id: string }) => s.id);
  assert.equal(new Set(ids).size, 27);
  const prices = [...p1.body.data, ...p2.body.data, ...p3.body.data].map((s: { basePrice: number }) => s.basePrice);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b));
});

test('pagination: a page past the end is an empty list, not an error', async () => {
  const r = await get('/services?limit=10&page=4');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.data, []);
  assert.equal(r.body.meta.total, 27);
  assert.equal(r.body.meta.totalPages, 3);
});

/* ---------- filters / sort ---------- */
test('only active services in active categories are returned', async () => {
  const r = await get('/services?limit=50');
  const slugs = r.body.data.map((s: { slug: string }) => s.slug);
  assert.ok(!slugs.includes('svc-7'), 'inactive service leaked');
  assert.ok(!slugs.includes('svc-29') && !slugs.includes('svc-30'), 'service from inactive category leaked');
});

test('category filter accepts a slug or an id; unknown / inactive category is an empty page', async () => {
  assert.equal((await get('/services?category=home-cleaning&limit=50')).body.meta.total, 11); // 12 minus inactive #7
  assert.equal((await get(`/services?category=${CLEAN}&limit=50`)).body.meta.total, 11);
  const none = await get('/services?category=hidden');
  assert.equal(none.status, 200);
  assert.equal(none.body.meta.total, 0);
});

test('price, rating, duration and availability filters narrow results correctly', async () => {
  const price = await get('/services?minPrice=500&maxPrice=800&limit=50');
  assert.ok(price.body.data.every((s: { basePrice: number }) => s.basePrice >= 500 && s.basePrice <= 800));
  const rating = await get('/services?rating=4&limit=50');
  assert.ok(rating.body.data.length > 0 && rating.body.data.every((s: { rating: number }) => s.rating >= 4));
  const dur = await get('/services?duration=60&limit=50');
  assert.ok(dur.body.data.length > 0 && dur.body.data.every((s: { durationMinutes: number }) => s.durationMinutes <= 60));
  const today = await get('/services?availability=today&limit=50');
  assert.ok(today.body.data.length > 0 && today.body.data.every((s: { availability: string }) => s.availability === 'today'));
  const tomorrow = await get('/services?availability=tomorrow&limit=50');
  assert.ok(tomorrow.body.data.every((s: { availability: string }) => s.availability !== 'scheduled'));
  assert.ok(tomorrow.body.meta.total > today.body.meta.total);
});

test('q searches name and description; sort variants all work', async () => {
  const q = await get('/services?q=ac+repair');
  assert.equal(q.status, 200);
  assert.ok(q.body.data.some((s: { slug: string }) => s.slug === 'svc-5'));
  for (const sort of ['popular', 'rating', 'price-asc', 'price-desc', 'newest', 'relevance']) {
    assert.equal((await get(`/services?sort=${sort}`)).status, 200, sort);
  }
  const desc = await get('/services?sort=price-desc&limit=3');
  assert.deepEqual(desc.body.data.map((s: { basePrice: number }) => s.basePrice), [2800, 2700, 2600]);
});

test('buildServiceQuery: text search switches default sort to relevance; explicit sort wins', () => {
  const cats = [CLEAN];
  assert.equal(buildServiceQuery(serviceQuerySchema.parse({ q: 'ac' }), cats).textScore, true);
  assert.equal(buildServiceQuery(serviceQuerySchema.parse({ q: 'ac', sort: 'rating' }), cats).textScore, false);
  assert.equal(buildServiceQuery(serviceQuerySchema.parse({}), cats).textScore, false);
  const s = buildServiceQuery(serviceQuerySchema.parse({ sort: 'price-asc' }), cats).sort;
  assert.deepEqual(Object.keys(s).pop(), '_id'); // stable tie-breaker
});

/* ---------- public fields only ---------- */
const PUBLIC_SERVICE_KEYS = ['availability', 'basePrice', 'category', 'description', 'durationMinutes', 'icon', 'id', 'name', 'rating', 'ratingCount', 'slug'];

test('service list items expose public fields only', async () => {
  const r = await get('/services?limit=3');
  for (const s of r.body.data) {
    assert.deepEqual(Object.keys(s).sort(), PUBLIC_SERVICE_KEYS);
    assert.deepEqual(Object.keys(s.category).sort(), ['id', 'name', 'slug']);
  }
  const raw = JSON.stringify(r.body);
  for (const secret of ['isActive', 'active', 'bookingsCount', '__v', 'createdAt', 'categoryId', '_id']) assert.ok(!raw.includes(`"${secret}"`), `${secret} leaked`);
});

test('GET /categories: active only, admin order, public fields, service counts', async () => {
  const r = await get<Cat[]>('/categories');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.data.map((c: { slug: string }) => c.slug), ['home-cleaning', 'appliance-repair']);
  assert.equal(r.body.data[0].serviceCount, 11);
  assert.deepEqual(Object.keys(r.body.data[0]).sort(), ['description', 'fromPrice', 'icon', 'id', 'name', 'popular', 'serviceCount', 'slug', 'sortOrder']);
  assert.equal(r.body.data[0].fromPrice, 100); // cheapest active service in Home Cleaning (svc-1)
  assert.equal(r.body.data.filter((c) => c.popular).length, 1, 'exactly one most-booked category');
  assert.equal(r.body.data.find((c) => c.popular)?.slug, 'appliance-repair'); // higher bookings than Home Cleaning
  assert.ok(!JSON.stringify(r.body).includes('bookings'), 'raw booking counts must not be exposed');
  assert.ok(!JSON.stringify(r.body).includes('active'));
});

test('GET /services/:idOrSlug: found by slug, 404 for inactive, 400 for malformed', async () => {
  const ok = await get<{ addOns: unknown[] }>('/services/svc-1');
  assert.equal(ok.status, 200);
  assert.ok(Array.isArray(ok.body.data.addOns));
  assert.equal((await get('/services/svc-7')).status, 404); // inactive
  assert.equal((await get('/services/svc-29')).status, 404); // inactive category
  assert.equal((await get('/services/does-not-exist')).status, 404);
  assert.equal((await get('/services/Bad%20Slug!')).status, 400);
});
