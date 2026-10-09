import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { Types } from 'mongoose';
import { addressesService } from './addresses.service';
import { installFakeRepository, restoreRepository } from './addresses.testkit';
import { MAX_SAVED_ADDRESSES } from './addresses.constants';
import { createAddressBodySchema, serviceabilityQuerySchema, updateAddressBodySchema } from './addresses.validation';

/* The in-memory repository lives in addresses.testkit.ts. */

beforeEach(() => installFakeRepository());
afterEach(() => restoreRepository());

const A = new Types.ObjectId().toString();
const B = new Types.ObjectId().toString();
const base = { house: '12', street: 'MG Road', city: 'Hyderabad', state: 'Telangana', pincode: '500081' };
const idOf = (a: { id: string }) => a.id;
const defaultsOf = async (customerId: string) => (await addressesService.list(customerId)).filter((a) => a.isDefault);

async function rejects(p: Promise<unknown>, status: number, code: string) {
  await assert.rejects(p, (e: { status?: number; statusCode?: number; code?: string }) => {
    assert.equal(e.status ?? e.statusCode, status);
    assert.equal(e.code, code);
    return true;
  });
}

/* ---------- serviceability ---------- */

describe('serviceability (Settings pincode list)', () => {
  test('a listed pincode is serviceable and labelled with its city', async () => {
    assert.deepEqual(await addressesService.checkServiceability('500081'), {
      serviceable: true,
      pincode: '500081',
      city: 'Hyderabad',
      state: 'Telangana',
    });
  });

  test('a pincode missing from the list is not serviceable, even with a known prefix', async () => {
    assert.deepEqual(await addressesService.checkServiceability('500072'), { serviceable: false, pincode: '500072' });
  });

  test('the result follows the Settings list, not a hardcoded one', async () => {
    addressesService.serviceablePincodes = async () => ['110001'];
    assert.equal((await addressesService.checkServiceability('110001')).serviceable, true);
    assert.equal((await addressesService.checkServiceability('500081')).serviceable, false);
  });

  test('assertServiceable throws 422 ADDRESS_NOT_SERVICEABLE', async () => {
    await rejects(addressesService.assertServiceable('999999'), 422, 'ADDRESS_NOT_SERVICEABLE');
  });
});

/* ---------- create + single default ---------- */

describe('create and the single default', () => {
  test('the first address becomes the default even if not asked', async () => {
    const a = await addressesService.create(A, base);
    assert.equal(a.isDefault, true);
  });

  test('later addresses are not the default unless asked', async () => {
    await addressesService.create(A, base);
    const b = await addressesService.create(A, { ...base, label: 'Work' });
    assert.equal(b.isDefault, false);
    assert.equal((await defaultsOf(A)).length, 1);
  });

  test('asking for the default moves it: still exactly one', async () => {
    const first = await addressesService.create(A, base);
    const second = await addressesService.create(A, { ...base, street: 'Road 2', isDefault: true });
    const defaults = await defaultsOf(A);
    assert.equal(defaults.length, 1);
    assert.equal(defaults[0].id, second.id);
    assert.notEqual(defaults[0].id, first.id);
  });

  test("another customer's default is untouched", async () => {
    await addressesService.create(B, base);
    await addressesService.create(A, base);
    await addressesService.create(A, { ...base, isDefault: true });
    assert.equal((await defaultsOf(B)).length, 1);
  });

  test(`at most ${MAX_SAVED_ADDRESSES} addresses per customer`, async () => {
    for (let i = 0; i < MAX_SAVED_ADDRESSES; i++) await addressesService.create(A, base);
    await rejects(addressesService.create(A, base), 409, 'ADDRESS_LIMIT_REACHED');
  });

  test('a serviceable pincode gets a fallback map location; an unserviceable one does not', async () => {
    const ok = await addressesService.create(A, base);
    const no = await addressesService.create(A, { ...base, pincode: '560001' });
    assert.ok(ok.location);
    assert.equal(ok.serviceable, true);
    assert.equal(no.location, undefined);
    assert.equal(no.serviceable, false);
  });

  test('house, street and area are stored and also derive line1 / line2 for the booking module', async () => {
    const a = await addressesService.create(A, { ...base, area: 'Madhapur' });
    assert.equal(a.house, '12');
    assert.equal(a.line1, '12, MG Road');
    assert.equal(a.line2, 'Madhapur');
  });

  test('a legacy line1 / line2 address is still accepted', async () => {
    const a = await addressesService.create(A, { line1: 'Flat 302, Manjeera Trinity', line2: 'Kukatpally', city: 'Hyderabad', state: 'Telangana', pincode: '500081' });
    assert.equal(a.line1, 'Flat 302, Manjeera Trinity');
    assert.equal(a.line2, 'Kukatpally');
  });
});

/* ---------- update ---------- */

describe('update', () => {
  test('editing area changes line2 and keeps line1', async () => {
    const a = await addressesService.create(A, { ...base, area: 'Madhapur' });
    const u = await addressesService.update(A, idOf(a), { area: 'Gachibowli' });
    assert.equal(u.line1, '12, MG Road');
    assert.equal(u.line2, 'Gachibowli');
  });

  test('editing house recomputes line1', async () => {
    const a = await addressesService.create(A, base);
    const u = await addressesService.update(A, idOf(a), { house: '99' });
    assert.equal(u.line1, '99, MG Road');
  });

  test('set default via update moves the default', async () => {
    const first = await addressesService.create(A, base);
    const second = await addressesService.create(A, base);
    await addressesService.update(A, idOf(second), { isDefault: true });
    const defaults = await defaultsOf(A);
    assert.deepEqual(defaults.map(idOf), [second.id]);
    assert.notEqual(defaults[0].id, first.id);
  });

  test('un-defaulting the only default is ignored: the customer keeps a default', async () => {
    const a = await addressesService.create(A, base);
    const u = await addressesService.update(A, idOf(a), { isDefault: false, landmark: 'Near metro' });
    assert.equal(u.isDefault, true);
    assert.equal(u.landmark, 'Near metro');
  });

  test('changing to an unserviceable pincode clears the location; back to a serviceable one restores it', async () => {
    const a = await addressesService.create(A, base);
    const gone = await addressesService.update(A, idOf(a), { pincode: '560001' });
    assert.equal(gone.location, undefined);
    assert.equal(gone.serviceable, false);
    const back = await addressesService.update(A, idOf(a), { pincode: '506005' });
    assert.ok(back.location);
    assert.equal(back.serviceable, true);
  });

  test("another customer's address returns 404 and is not changed", async () => {
    const a = await addressesService.create(A, base);
    await rejects(addressesService.update(B, idOf(a), { city: 'Pune' }), 404, 'ADDRESS_NOT_FOUND');
    assert.equal((await addressesService.list(A))[0].city, 'Hyderabad');
  });

  test('an id that does not exist returns 404', async () => {
    await rejects(addressesService.update(A, new Types.ObjectId().toString(), { city: 'Pune' }), 404, 'ADDRESS_NOT_FOUND');
  });
});

/* ---------- delete + promotion ---------- */

describe('delete', () => {
  test('deleting the default promotes the newest remaining address', async () => {
    const first = await addressesService.create(A, base); // default
    const second = await addressesService.create(A, base);
    const third = await addressesService.create(A, base);
    await addressesService.remove(A, idOf(first));
    const defaults = await defaultsOf(A);
    assert.deepEqual(defaults.map(idOf), [third.id]);
    assert.ok((await addressesService.list(A)).some((x) => x.id === second.id));
  });

  test('deleting a non-default leaves the default alone', async () => {
    const first = await addressesService.create(A, base);
    const second = await addressesService.create(A, base);
    await addressesService.remove(A, idOf(second));
    assert.deepEqual((await defaultsOf(A)).map(idOf), [first.id]);
  });

  test('deleting the last address leaves none, and the next one is the default again', async () => {
    const only = await addressesService.create(A, base);
    await addressesService.remove(A, idOf(only));
    assert.equal((await addressesService.list(A)).length, 0);
    assert.equal((await addressesService.create(A, base)).isDefault, true);
  });

  test("another customer's address returns 404 and is not deleted", async () => {
    const a = await addressesService.create(A, base);
    await rejects(addressesService.remove(B, idOf(a)), 404, 'ADDRESS_NOT_FOUND');
    assert.equal((await addressesService.list(A)).length, 1);
  });

  test('deleting twice: the second is 404', async () => {
    const a = await addressesService.create(A, base);
    await addressesService.remove(A, idOf(a));
    await rejects(addressesService.remove(A, idOf(a)), 404, 'ADDRESS_NOT_FOUND');
  });
});

/* ---------- list + booking use ---------- */

describe('list and booking', () => {
  test('the default comes first and every address says whether it is serviceable', async () => {
    await addressesService.create(A, { ...base, pincode: '560001' }); // default (first), unserviceable
    const ok = await addressesService.create(A, base);
    const list = await addressesService.list(A);
    assert.equal(list[0].isDefault, true);
    assert.deepEqual(list.map((x) => x.serviceable), [false, true]);
    assert.ok(list.some((x) => x.id === ok.id));
  });

  test("a customer never sees another customer's addresses", async () => {
    await addressesService.create(A, base);
    assert.equal((await addressesService.list(B)).length, 0);
  });

  test("resolveForBooking: another customer's address is 404, an unserviceable one is 422", async () => {
    const mine = await addressesService.create(A, base);
    const far = await addressesService.create(A, { ...base, pincode: '560001' });
    await rejects(addressesService.resolveForBooking(B, idOf(mine)), 404, 'ADDRESS_NOT_FOUND');
    await rejects(addressesService.resolveForBooking(A, idOf(far)), 422, 'ADDRESS_NOT_SERVICEABLE');
    const ok = await addressesService.resolveForBooking(A, idOf(mine));
    assert.equal(ok.line1, '12, MG Road');
    assert.equal(ok.sourceAddressId, mine.id);
  });
});

/* ---------- request validation ---------- */

describe('validation', () => {
  const valid = { ...base, label: 'Home' };

  test('a complete address passes', () => {
    assert.equal(createAddressBodySchema.safeParse(valid).success, true);
  });

  test('label must be Home, Work or Other', () => {
    assert.equal(createAddressBodySchema.safeParse({ ...valid, label: 'Office' }).success, false);
    for (const label of ['Home', 'Work', 'Other']) assert.equal(createAddressBodySchema.safeParse({ ...valid, label }).success, true);
  });

  test('pincode must be exactly 6 digits', () => {
    for (const pincode of ['5000', '50008', '5000811', 'abcdef', '']) {
      assert.equal(createAddressBodySchema.safeParse({ ...valid, pincode }).success, false, pincode);
    }
    assert.equal(serviceabilityQuerySchema.safeParse({ pincode: '5000' }).success, false);
    assert.equal(serviceabilityQuerySchema.safeParse({}).success, false);
    assert.equal(serviceabilityQuerySchema.safeParse({ pincode: '500081' }).success, true);
  });

  test('city, state and pincode are required', () => {
    for (const field of ['city', 'state', 'pincode']) {
      const body: Record<string, unknown> = { ...valid };
      delete body[field];
      assert.equal(createAddressBodySchema.safeParse(body).success, false, field);
    }
  });

  test('house and street are required unless the legacy line1 is sent', () => {
    const noParts: Record<string, unknown> = { ...valid };
    delete noParts.house;
    delete noParts.street;
    assert.equal(createAddressBodySchema.safeParse(noParts).success, false);
    assert.equal(createAddressBodySchema.safeParse({ ...noParts, house: '12' }).success, false);
    assert.equal(createAddressBodySchema.safeParse({ ...noParts, line1: '12 MG Road' }).success, true);
  });

  test('a patch needs at least one field, and each field is still checked', () => {
    assert.equal(updateAddressBodySchema.safeParse({}).success, false);
    assert.equal(updateAddressBodySchema.safeParse({ landmark: 'Near metro' }).success, true);
    assert.equal(updateAddressBodySchema.safeParse({ isDefault: true }).success, true);
    assert.equal(updateAddressBodySchema.safeParse({ pincode: '123' }).success, false);
    assert.equal(updateAddressBodySchema.safeParse({ label: 'Office' }).success, false);
  });

  test('unknown fields (like customerId) are dropped, never stored', () => {
    const parsed = createAddressBodySchema.parse({ ...valid, customerId: 'x', _id: 'y' });
    assert.equal('customerId' in parsed, false);
    assert.equal('_id' in parsed, false);
  });
});
