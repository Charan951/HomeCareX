import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, beforeEach, test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { errorHandler } from '../../middleware/error.middleware';
import { addressesRepository as repo } from './addresses.repository';
import { addressesRoutes } from './addresses.routes';
import { MAX_ADDRESSES_PER_USER } from './addresses.constants';
import type { AddressRow } from './addresses.types';

/* In-memory stand-in for the repository: same scoping rules (every call filters by userId). */
type Doc = AddressRow & { userId: string; updatedAt: number };
let db: Doc[] = [];
let clock = 0;
const oid = () => new Types.ObjectId();
const A = oid().toString();
const B = oid().toString();
const PARTNER = oid().toString();
const own = (u: Types.ObjectId) => db.filter((d) => d.userId === u.toString());
const strip = ({ userId: _u, updatedAt: _t, ...row }: Doc): AddressRow => row;

function installFakeRepo() {
  repo.list = (async (u: Types.ObjectId) =>
    own(u).sort((x, y) => Number(y.isDefault) - Number(x.isDefault) || y.updatedAt - x.updatedAt).map(strip)) as never;
  repo.findOwned = (async (u: Types.ObjectId, id: Types.ObjectId) => {
    const d = own(u).find((x) => x._id.toString() === id.toString());
    return d ? strip(d) : null;
  }) as never;
  repo.count = (async (u: Types.ObjectId) => own(u).length) as never;
  repo.create = (async (u: Types.ObjectId, input: Record<string, unknown>) => {
    const d = { _id: oid(), userId: u.toString(), updatedAt: ++clock, ...input } as unknown as Doc;
    db.push(d);
    return strip(d);
  }) as never;
  repo.update = (async (u: Types.ObjectId, id: Types.ObjectId, patch: Record<string, unknown>) => {
    const d = own(u).find((x) => x._id.toString() === id.toString());
    if (!d) return null;
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete (d as unknown as Record<string, unknown>)[k];
      else (d as unknown as Record<string, unknown>)[k] = v;
    }
    d.updatedAt = ++clock;
    return strip(d);
  }) as never;
  repo.delete = (async (u: Types.ObjectId, id: Types.ObjectId) => {
    const before = db.length;
    db = db.filter((x) => !(x.userId === u.toString() && x._id.toString() === id.toString()));
    return db.length < before;
  }) as never;
  repo.makeDefault = (async (u: Types.ObjectId, id: Types.ObjectId) => {
    const d = own(u).find((x) => x._id.toString() === id.toString());
    if (!d) return null;
    own(u).forEach((x) => (x.isDefault = false));
    d.isDefault = true;
    d.updatedAt = ++clock;
    return strip(d);
  }) as never;
  repo.clearDefaultExcept = (async (u: Types.ObjectId, keep: Types.ObjectId) => {
    own(u).filter((x) => x._id.toString() !== keep.toString()).forEach((x) => (x.isDefault = false));
  }) as never;
  repo.promoteNewest = (async (u: Types.ObjectId) => {
    const newest = own(u).sort((x, y) => y.updatedAt - x.updatedAt)[0];
    if (newest) newest.isDefault = true;
  }) as never;
}

let base = '';
let close: () => Promise<void> = async () => undefined;
const secret = process.env.JWT_SECRET || 'dev_access_secret_change_me';
const token = (sub: string, role = 'customer') => jwt.sign({ sub, role }, secret, { expiresIn: '5m' });

async function call(method: string, path: string, bearer?: string, body?: unknown) {
  const res = await fetch(`${base}/api/v1/customer/addresses${path}`, {
    method,
    headers: { ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: (await res.json()) as { data?: any; code?: string } }; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const home = { label: 'Home', line1: 'Flat 302, Manjeera Trinity', area: 'Kukatpally', city: 'Hyderabad', pincode: '500072' };
const office = { label: 'Office', line1: 'WeWork, Hitech City', city: 'Hyderabad' };

before(async () => {
  installFakeRepo();
  const app = express();
  app.use(express.json());
  app.use('/api/v1/customer/addresses', addressesRoutes);
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  close = () => new Promise((r) => server.close(() => r()));
});
after(async () => close());
beforeEach(() => {
  db = [];
  clock = 0;
});

test('create: the first address becomes the default automatically', async () => {
  const r = await call('POST', '', token(A), home);
  assert.equal(r.status, 201);
  assert.equal(r.body.data.isDefault, true);
  assert.equal(r.body.data.pincode, '500072');
});

test('create: a second address is not default unless asked; asking moves the default', async () => {
  await call('POST', '', token(A), home);
  const second = await call('POST', '', token(A), office);
  assert.equal(second.body.data.isDefault, false);
  const third = await call('POST', '', token(A), { ...office, label: 'Parents', isDefault: true });
  assert.equal(third.body.data.isDefault, true);
  const list = await call('GET', '', token(A));
  assert.equal(list.body.data.filter((a: { isDefault: boolean }) => a.isDefault).length, 1);
  assert.equal(list.body.data[0].label, 'Parents'); // default first
});

test('list: a customer only ever sees their own addresses', async () => {
  await call('POST', '', token(A), home);
  await call('POST', '', token(B), { ...home, label: 'B home' });
  const a = await call('GET', '', token(A));
  assert.deepEqual(a.body.data.map((x: { label: string }) => x.label), ['Home']);
  const b = await call('GET', '', token(B));
  assert.deepEqual(b.body.data.map((x: { label: string }) => x.label), ['B home']);
});

test('select ("deliver here"): PUT /:id/default moves the default and only one stays default', async () => {
  await call('POST', '', token(A), home);
  const o = await call('POST', '', token(A), office);
  const r = await call('PUT', `/${o.body.data.id}/default`, token(A));
  assert.equal(r.status, 200);
  assert.equal(r.body.data.isDefault, true);
  const list = await call('GET', '', token(A));
  assert.equal(list.body.data.filter((a: { isDefault: boolean }) => a.isDefault).length, 1);
  assert.equal(list.body.data[0].id, o.body.data.id);
});

test('update: edits fields, and null clears area / pincode', async () => {
  const c = await call('POST', '', token(A), home);
  const r = await call('PATCH', `/${c.body.data.id}`, token(A), { line1: 'New line', area: null, pincode: null });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.line1, 'New line');
  assert.equal(r.body.data.area, null);
  assert.equal(r.body.data.pincode, null);
});

test('delete: removing the default promotes another address', async () => {
  const h = await call('POST', '', token(A), home);
  await call('POST', '', token(A), office);
  const r = await call('DELETE', `/${h.body.data.id}`, token(A));
  assert.equal(r.status, 200);
  const list = await call('GET', '', token(A));
  assert.equal(list.body.data.length, 1);
  assert.equal(list.body.data[0].isDefault, true);
});

test("SECURITY: A cannot update, select or delete B's address (404, and it is untouched)", async () => {
  const b = await call('POST', '', token(B), home);
  const id = b.body.data.id;
  assert.equal((await call('PATCH', `/${id}`, token(A), { line1: 'hacked' })).status, 404);
  assert.equal((await call('PUT', `/${id}/default`, token(A))).status, 404);
  assert.equal((await call('DELETE', `/${id}`, token(A))).status, 404);
  const still = await call('GET', '', token(B));
  assert.equal(still.body.data[0].line1, home.line1);
});

test('SECURITY: a userId in the body is rejected — identity only comes from the token', async () => {
  const r = await call('POST', '', token(A), { ...home, userId: B });
  assert.equal(r.status, 400);
  assert.equal(db.length, 0);
});

test('auth: 401 without a token, 403 for partner / admin', async () => {
  assert.equal((await call('GET', '')).status, 401);
  assert.equal((await call('GET', '', token(PARTNER, 'partner'))).status, 403);
  assert.equal((await call('POST', '', token(PARTNER, 'admin'), home)).status, 403);
});

test('validation: missing fields, bad pincode, bad id, empty patch, isDefault:false → 400', async () => {
  assert.equal((await call('POST', '', token(A), { label: 'X' })).status, 400);
  assert.equal((await call('POST', '', token(A), { ...home, pincode: '12' })).status, 400);
  assert.equal((await call('PATCH', '/123', token(A), { label: 'X' })).status, 400);
  const c = await call('POST', '', token(A), home);
  assert.equal((await call('PATCH', `/${c.body.data.id}`, token(A), {})).status, 400);
  assert.equal((await call('PATCH', `/${c.body.data.id}`, token(A), { isDefault: false })).status, 400);
});

test(`limit: at most ${MAX_ADDRESSES_PER_USER} addresses per customer (409)`, async () => {
  for (let i = 0; i < MAX_ADDRESSES_PER_USER; i++) {
    assert.equal((await call('POST', '', token(A), { ...office, label: `Addr ${i}` })).status, 201);
  }
  assert.equal((await call('POST', '', token(A), office)).status, 409);
});
