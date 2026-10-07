import assert from 'node:assert/strict';
import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import path from 'node:path';
import { after, before, beforeEach, test } from 'node:test';
import express from 'express';
import { Types } from 'mongoose';
import { ServiceModel } from '../../models/Service';
import { errorHandler } from '../../middleware/error.middleware';
import { addDays, nowInBookingTz } from '../bookings/bookings.time';
import { AVAILABILITY_WINDOW_DAYS, slotSource, summarizeAvailability } from './catalog.availability';
import { SERVICE_DETAILS_SEED, UNSUITABLE_IMAGES } from './catalog.detailsSeedData';
import { catalogRepository as repo, type CategoryRow, type ServiceRow } from './catalog.repository';
import { catalogRoutes } from './catalog.routes';
import { backfillServiceDetails } from './catalog.seed';
import { CATALOG_SEED_SERVICES } from './catalog.seedData';

/* ---------- in-memory stand-in for the repository ---------- */
const oid = () => new Types.ObjectId();
const CLEAN = oid(), HIDDEN = oid();
const categories: (CategoryRow & { active: boolean })[] = [
  { _id: CLEAN, name: 'Home Cleaning', slug: 'home-cleaning', sortOrder: 1, active: true },
  { _id: HIDDEN, name: 'Hidden', slug: 'hidden', sortOrder: 0, active: false },
];
type Doc = ServiceRow & { active: boolean; bookingsCount: number; __v: number };
const base = (over: Partial<Doc>): Doc => ({
  _id: oid(), slug: 'x', name: 'X', description: 'd', categoryId: CLEAN, basePrice: 499, durationMinutes: 60, ratingAvg: 4.6, ratingCount: 120,
  availability: 'today', active: true, bookingsCount: 77, __v: 0, ...over,
});
const FULL = base({
  slug: 'full-service', name: 'Full Service', basePrice: 1499, durationMinutes: 180,
  media: [{ url: '/images/a.png', alt: 'A' }, { url: '/images/b.png', alt: 'B' }],
  inclusions: ['Floors', 'Windows'],
  exclusions: ['Balcony grills'],
  addOns: [{ _id: oid(), name: 'Eco chemicals', price: 50 }],
  faqs: [{ _id: oid(), question: 'Q1?', answer: 'A1' }, { _id: oid(), question: 'Q2?', answer: 'A2' }],
});
const OLD = base({ slug: 'old-doc', name: 'Old doc' }); // created before n04: has none of the new fields
const INACTIVE = base({ slug: 'inactive-one', active: false, faqs: [{ _id: oid(), question: 'Q', answer: 'A' }] });
const IN_HIDDEN_CAT = base({ slug: 'hidden-cat', categoryId: HIDDEN });
const docs = [FULL, OLD, INACTIVE, IN_HIDDEN_CAT];

const slotCalls: string[] = [];
type DayFn = (serviceId: string, date: string) => { slot: string; available: boolean; remaining: number }[];
let dayFn: DayFn = () => [{ slot: '08:00-10:00', available: true, remaining: 3 }];
const TODAY = nowInBookingTz().date;

before(() => {
  repo.activeCategories = (async () => categories.filter((c) => c.active)) as never;
  repo.findService = (async (idOrSlug: string) => docs.find((d) => d.active && (String(d._id) === idOrSlug || d.slug === idOrSlug)) ?? null) as never;
  slotSource.getDaySlots = (async (serviceId: string, date: string) => {
    slotCalls.push(date);
    return { serviceId, date, slots: dayFn(serviceId, date) };
  }) as never;
});
beforeEach(() => {
  slotCalls.length = 0;
  dayFn = () => [{ slot: '08:00-10:00', available: true, remaining: 3 }];
});

const app = express();
app.use(catalogRoutes);
app.use(errorHandler);
let url = '';
let close = () => Promise.resolve();
before(() => {
  const server = app.listen(0);
  url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((r) => server.close(() => r()));
});
after(async () => close());

interface Detail {
  id: string; slug: string; name: string; basePrice: number; durationMinutes: number; rating: number; ratingCount: number; availability: string;
  media: { url: string; alt: string }[]; inclusions: string[]; exclusions: string[];
  addOns: { id: string; name: string; price: number }[]; faqs: { id: string; question: string; answer: string }[];
  slotAvailability: { windowDays: number; hasSlots: boolean | null; nextAvailableDate: string | null };
}
const get = async (p: string, headers: Record<string, string> = {}) => {
  const res = await fetch(url + p, { headers });
  return { status: res.status, body: (await res.json()) as { success: boolean; code?: string; data: Detail } };
};

/* ---------- response shape ---------- */
test('GET /services/:slug returns gallery, info, inclusions, exclusions, add-ons, FAQs, rating and slot availability', async () => {
  const r = await get('/services/full-service');
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const d = r.body.data;
  assert.equal(d.name, 'Full Service');
  assert.equal(d.basePrice, 1499);
  assert.equal(d.durationMinutes, 180);
  assert.equal(d.rating, 4.6);
  assert.equal(d.ratingCount, 120);
  assert.deepEqual(d.media, [{ url: '/images/a.png', alt: 'A' }, { url: '/images/b.png', alt: 'B' }]);
  assert.deepEqual(d.inclusions, ['Floors', 'Windows']);
  assert.deepEqual(d.exclusions, ['Balcony grills']);
  assert.equal(d.addOns[0].name, 'Eco chemicals');
  assert.equal(d.addOns[0].price, 50);
  assert.equal(d.slotAvailability.hasSlots, true);
});

test('the card label `availability` (today/tomorrow/scheduled) is unchanged; the 7-day summary is `slotAvailability`', async () => {
  const d = (await get('/services/full-service')).body.data;
  assert.equal(d.availability, 'today');
  assert.equal(typeof d.slotAvailability, 'object');
});

test('internal fields never leak (active, bookingsCount, __v, raw categoryId)', async () => {
  const text = JSON.stringify((await get('/services/full-service')).body.data);
  for (const key of ['bookingsCount', '"active"', '__v', 'categoryId']) assert.ok(!text.includes(key), `${key} leaked`);
});

test('works by id as well as by slug', async () => {
  const r = await get(`/services/${FULL._id}`);
  assert.equal(r.status, 200);
  assert.equal(r.body.data.slug, 'full-service');
});

/* ---------- FAQs only from the API ---------- */
test('FAQs come from the stored document, in order, each with an id', async () => {
  const { faqs } = (await get('/services/full-service')).body.data;
  assert.deepEqual(faqs.map((f) => [f.question, f.answer]), [['Q1?', 'A1'], ['Q2?', 'A2']]);
  assert.ok(faqs.every((f) => /^[0-9a-f]{24}$/.test(f.id)));
});

test('a service with no FAQs returns an empty list (nothing is invented server-side)', async () => {
  assert.deepEqual((await get('/services/old-doc')).body.data.faqs, []);
});

test('documents created before the new fields still work: media/inclusions/exclusions/faqs default to []', async () => {
  const d = (await get('/services/old-doc')).body.data;
  assert.equal(d.media.length + d.inclusions.length + d.exclusions.length + d.faqs.length, 0);
  assert.deepEqual(d.addOns, []);
});

/* ---------- 404 / validation / public ---------- */
test('unknown slug -> 404 NOT_FOUND', async () => {
  const r = await get('/services/does-not-exist');
  assert.equal(r.status, 404);
  assert.equal(r.body.success, false);
  assert.equal(r.body.code, 'NOT_FOUND');
});

test('unknown but well-formed id -> 404', async () => {
  assert.equal((await get(`/services/${oid()}`)).status, 404);
});

test('inactive service -> 404 (by slug and by id), even though it has FAQs', async () => {
  assert.equal((await get('/services/inactive-one')).status, 404);
  assert.equal((await get(`/services/${INACTIVE._id}`)).status, 404);
});

test('service in an inactive category -> 404', async () => {
  assert.equal((await get('/services/hidden-cat')).status, 404);
});

test('404s never call the slot service', async () => {
  await get('/services/does-not-exist');
  await get('/services/inactive-one');
  await get('/services/hidden-cat');
  assert.equal(slotCalls.length, 0);
});

test('malformed slug -> 400 VALIDATION_ERROR', async () => {
  const r = await get('/services/Bad%20Slug!');
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'VALIDATION_ERROR');
});

test('public: 200 with no token, a customer-style token and a garbage token', async () => {
  assert.equal((await get('/services/full-service')).status, 200);
  assert.equal((await get('/services/full-service', { Authorization: 'Bearer some.customer.token' })).status, 200);
  assert.equal((await get('/services/full-service', { Authorization: 'Bearer garbage' })).status, 200);
});

/* ---------- 7-day slot availability (via the slot service contract) ---------- */
test('slots today -> hasSlots true, nextAvailableDate today, and only ONE slot lookup', async () => {
  const a = (await get('/services/full-service')).body.data.slotAvailability;
  assert.deepEqual(a, { windowDays: 7, hasSlots: true, nextAvailableDate: TODAY });
  assert.equal(slotCalls.length, 1);
});

test('first free slot on day 4 -> nextAvailableDate is that day; earlier days were checked in order', async () => {
  const free = addDays(TODAY, 3);
  dayFn = (_id, date) => [{ slot: '10:00-12:00', available: date === free, remaining: date === free ? 1 : 0 }];
  const a = (await get('/services/full-service')).body.data.slotAvailability;
  assert.deepEqual(a, { windowDays: 7, hasSlots: true, nextAvailableDate: free });
  assert.deepEqual(slotCalls, [0, 1, 2, 3].map((i) => addDays(TODAY, i)));
});

test('fully booked for 7 days -> hasSlots false, no date, exactly today..today+6 checked (not day 8)', async () => {
  dayFn = () => [{ slot: '08:00-10:00', available: false, remaining: 0 }, { slot: '10:00-12:00', available: false, remaining: 0 }];
  const a = (await get('/services/full-service')).body.data.slotAvailability;
  assert.deepEqual(a, { windowDays: 7, hasSlots: false, nextAvailableDate: null });
  assert.deepEqual(slotCalls, [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(TODAY, i)));
});

test('a slot only on day 8 is outside the window -> reported as no slots', async () => {
  const beyond = addDays(TODAY, 7);
  dayFn = (_id, date) => [{ slot: '08:00-10:00', available: date === beyond, remaining: 1 }];
  assert.equal((await get('/services/full-service')).body.data.slotAvailability.hasSlots, false);
});

test('slot service throws -> page still 200 and hasSlots is null (unknown), never a false "no slots"', async () => {
  const orig = console.error;
  console.error = () => undefined; // the failure is logged on purpose; keep test output clean
  dayFn = () => { throw new Error('slot service down'); };
  try {
    const r = await get('/services/full-service');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.data.slotAvailability, { windowDays: 7, hasSlots: null, nextAvailableDate: null });
    assert.equal(r.body.data.name, 'Full Service'); // the rest of the page is unaffected
  } finally {
    console.error = orig;
  }
});

test('summarizeAvailability uses the given "today" and the shared 7-day constant', async () => {
  assert.equal(AVAILABILITY_WINDOW_DAYS, 7);
  dayFn = () => [];
  const a = await summarizeAvailability('x'.repeat(24), '2026-12-28');
  assert.equal(a.hasSlots, false);
  assert.deepEqual(slotCalls, ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-01', '2027-01-02', '2027-01-03']); // crosses the year
});

/* ---------- seed content ---------- */
test('every launch service has details content, and nothing extra', () => {
  const seeded = CATALOG_SEED_SERVICES.map((s) => s.slug).sort();
  assert.deepEqual(Object.keys(SERVICE_DETAILS_SEED).sort(), seeded);
});

test('seed content is complete and fits the model limits (media 1+, inclusions 2+, exclusions 1+, FAQs 2+)', () => {
  for (const [slug, d] of Object.entries(SERVICE_DETAILS_SEED)) {
    assert.ok(d.images.length >= 1, `${slug}: no images`);
    assert.ok(d.inclusions.length >= 2, `${slug}: too few inclusions`);
    assert.ok(d.exclusions.length >= 1, `${slug}: no exclusions`);
    assert.ok(d.faqs.length >= 2, `${slug}: too few FAQs`);
    for (const t of [...d.inclusions, ...d.exclusions]) assert.ok(t.length > 0 && t.length <= 200, `${slug}: bad list item "${t}"`);
    for (const [q, a] of d.faqs) {
      assert.ok(q.endsWith('?') && q.length <= 200, `${slug}: bad question "${q}"`);
      assert.ok(a.length > 0 && a.length <= 1000, `${slug}: bad answer`);
    }
    assert.equal(new Set(d.images).size, d.images.length, `${slug}: duplicate image`);
  }
});

test('every seeded gallery image exists in frontend/public (skipped when the frontend folder is absent)', (t) => {
  const publicDir = path.resolve(__dirname, '../../../../frontend/public');
  if (!fs.existsSync(publicDir)) return t.skip('frontend/public not found');
  const missing = Object.entries(SERVICE_DETAILS_SEED).flatMap(([slug, d]) => d.images.filter((img) => !fs.existsSync(path.join(publicDir, img))).map((img) => `${slug}: ${img}`));
  assert.deepEqual(missing, []);
});

/* ---------- gallery photo sets ---------- */
test('no gallery uses a photo on the do-not-use list (watermarks, artwork, banners, tiny files)', () => {
  const used = Object.entries(SERVICE_DETAILS_SEED).flatMap(([slug, d]) => d.images.map((img) => ({ slug, file: img.split('/').pop() ?? img })));
  const bad = used.filter((u) => u.file in UNSUITABLE_IMAGES).map((u) => `${u.slug}: ${u.file} (${UNSUITABLE_IMAGES[u.file]})`);
  assert.deepEqual(bad, []);
});

test('gallery photos are all real photos from /images (no illustrations from /images/catalog)', () => {
  for (const [slug, d] of Object.entries(SERVICE_DETAILS_SEED)) {
    for (const img of d.images) assert.match(img, /^\/images\/[^/]+\.(jpg|png)$/, `${slug}: ${img}`);
  }
});

test('multi-photo galleries: at least 27 of 30 services have 2+ photos, none has more than 5, and the rest have exactly 1', () => {
  const counts = Object.entries(SERVICE_DETAILS_SEED).map(([slug, d]) => [slug, d.images.length] as const);
  assert.ok(counts.every(([, n]) => n >= 1 && n <= 5), JSON.stringify(counts.filter(([, n]) => n < 1 || n > 5)));
  assert.ok(counts.filter(([, n]) => n >= 2).length >= 27);
  assert.deepEqual(counts.filter(([, n]) => n === 1).map(([slug]) => slug).sort(), ['bridal-makeup', 'mens-haircut-grooming', 'water-tank-cleaning']);
});

test('a service whose own photo exists leads its gallery with it', () => {
  for (const slug of ['bathroom-deep-cleaning', 'kitchen-deep-cleaning', 'washing-machine-repair', 'refrigerator-repair', 'microwave-oven-repair', 'mosquito-fogging', 'bed-bug-treatment', 'terrace-waterproofing', 'texture-accent-wall', 'room-painting-per-room', 'full-body-massage', 'bridal-makeup']) {
    assert.equal(SERVICE_DETAILS_SEED[slug].images[0], `/images/${slug}.png`, slug);
  }
});

/* ---------- seed: refreshing galleries ---------- */
type Op = { updateOne: { filter: Record<string, unknown>; update: { $set: Record<string, unknown> } } };
async function runBackfill(opts?: { refreshMedia?: boolean }): Promise<Op[]> {
  const orig = ServiceModel.bulkWrite;
  let captured: Op[] = [];
  ServiceModel.bulkWrite = (async (ops: Op[]) => { captured = ops; return { modifiedCount: ops.length }; }) as never;
  try {
    await backfillServiceDetails(opts);
  } finally {
    ServiceModel.bulkWrite = orig;
  }
  return captured;
}
const mediaOps = (ops: Op[]) => ops.filter((o) => 'media' in o.updateOne.update.$set);

test('default seed only fills an EMPTY gallery (an admin\'s own photos are never overwritten)', async () => {
  const ops = mediaOps(await runBackfill());
  assert.equal(ops.length, 30);
  for (const o of ops) assert.ok('$or' in o.updateOne.filter, 'media filter must require an empty gallery');
});

test('--refresh-media replaces the gallery of every launch service, and nothing else changes', async () => {
  const normal = await runBackfill();
  const refreshed = await runBackfill({ refreshMedia: true });
  const m = mediaOps(refreshed);
  assert.equal(m.length, 30);
  for (const o of m) assert.deepEqual(Object.keys(o.updateOne.filter), ['slug'], 'refresh must match by slug only');
  const rest = (ops: Op[]) => JSON.stringify(ops.filter((o) => !('media' in o.updateOne.update.$set)));
  assert.equal(rest(refreshed), rest(normal), 'descriptions, inclusions, exclusions and FAQs behave the same with or without the flag');
});

test('the refreshed gallery written to the database matches the seed photos, in order, with alt text', async () => {
  const ops = mediaOps(await runBackfill({ refreshMedia: true }));
  const deep = ops.find((o) => o.updateOne.filter.slug === 'deep-home-cleaning');
  assert.deepEqual(deep?.updateOne.update.$set.media, SERVICE_DETAILS_SEED['deep-home-cleaning'].images.map((url, i) => ({ url, alt: `Deep Home Cleaning (photo ${i + 1})` })));
});
