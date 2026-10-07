import assert from 'node:assert/strict';
import test from 'node:test';
import { signWebhookBody, toPaise, verifyCheckoutSignature, verifyWebhookSignature } from './payments.crypto';
import { isCodOnlinePayableStatus } from './payments.constants';
import { orderBodySchema, verifyBodySchema } from './payments.validation';
import { processWebhook, type WebhookStore } from './payments.service';
import type { RazorpayPaymentEntity } from './payments.types';

const SECRET = 'whsec_test';

/** In-memory store with the same unique-event-id rule as the PaymentEvent index. */
function fakeStore(opts: { failSettle?: boolean } = {}) {
  const seen = new Set<string>();
  const calls = { settled: [] as string[], failed: [] as string[] };
  const store: WebhookStore = {
    async recordEvent(e) {
      if (seen.has(e.eventId)) return false;
      seen.add(e.eventId);
      return true;
    },
    async forgetEvent(id) {
      seen.delete(id);
    },
    async settleCaptured(entity: RazorpayPaymentEntity) {
      if (opts.failSettle) throw new Error('db down');
      calls.settled.push(entity.id);
      return { confirmed: true };
    },
    async noteFailed(entity: RazorpayPaymentEntity) {
      calls.failed.push(entity.id);
    },
  };
  return { store, calls, seen };
}

const body = (event: string, paymentId = 'pay_1') =>
  Buffer.from(JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: 'order_1', amount: 152800, currency: 'INR', status: 'captured' } } } }));

const call = (raw: Buffer, store: WebhookStore, over: { signature?: string; eventId?: string; secret?: string } = {}) =>
  processWebhook(
    { rawBody: raw, signature: over.signature ?? signWebhookBody(raw, SECRET), eventId: over.eventId ?? 'evt_1', secret: over.secret ?? SECRET },
    store,
  );

test('checkout signature: valid passes, tampered / empty fail', () => {
  const sig = signWebhookBody('order_1|pay_1', 'key_secret'); // same HMAC-SHA256 recipe
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', sig, 'key_secret'), true);
  assert.equal(verifyCheckoutSignature('order_1', 'pay_2', sig, 'key_secret'), false);
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', sig, 'other_secret'), false);
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', '', 'key_secret'), false);
  assert.equal(verifyCheckoutSignature('order_1', 'pay_1', 'short', 'key_secret'), false);
});

test('webhook signature is computed over the raw bytes', () => {
  const raw = body('payment.captured');
  assert.equal(verifyWebhookSignature(raw, signWebhookBody(raw, SECRET), SECRET), true);
  // Re-serialised JSON (different whitespace) must NOT verify against the original signature.
  const reserialised = Buffer.from(JSON.stringify(JSON.parse(raw.toString()), null, 2));
  assert.equal(verifyWebhookSignature(reserialised, signWebhookBody(raw, SECRET), SECRET), false);
  assert.equal(verifyWebhookSignature(Buffer.alloc(0), 'x', SECRET), false);
});

test('toPaise removes float noise', () => {
  assert.equal(toPaise(1528), 152800);
  assert.equal(toPaise(1499.0000001), 149900);
  assert.equal(toPaise(10.1), 1010);
});

test('webhook: invalid signature -> 400 INVALID_SIGNATURE and nothing is stored or settled', async () => {
  const { store, calls, seen } = fakeStore();
  const raw = body('payment.captured');
  await assert.rejects(call(raw, store, { signature: 'deadbeef' }), { statusCode: 400, code: 'INVALID_SIGNATURE' });
  await assert.rejects(call(raw, store, { signature: signWebhookBody(raw, 'wrong') }), { statusCode: 400, code: 'INVALID_SIGNATURE' });
  assert.equal(seen.size, 0);
  assert.deepEqual(calls.settled, []);
});

test('webhook: missing signature header / missing secret are rejected', async () => {
  const { store } = fakeStore();
  const raw = body('payment.captured');
  await assert.rejects(processWebhook({ rawBody: raw, signature: undefined, eventId: 'e', secret: SECRET }, store), { code: 'INVALID_SIGNATURE' });
  await assert.rejects(processWebhook({ rawBody: raw, signature: 'x', eventId: 'e', secret: undefined }, store), { statusCode: 503 });
});

test('webhook: first delivery settles, replay of the same event id is a no-op', async () => {
  const { store, calls } = fakeStore();
  const raw = body('payment.captured');
  assert.deepEqual(await call(raw, store), { outcome: 'processed', bookingConfirmed: true });
  assert.deepEqual(await call(raw, store), { outcome: 'replayed' });
  assert.deepEqual(await call(raw, store), { outcome: 'replayed' });
  assert.deepEqual(calls.settled, ['pay_1']); // settled exactly once
});

test('webhook: a different event id for the same payment is processed (settle itself is idempotent)', async () => {
  const { store, calls } = fakeStore();
  const raw = body('order.paid');
  await call(raw, store, { eventId: 'evt_a' });
  await call(raw, store, { eventId: 'evt_b' });
  assert.equal(calls.settled.length, 2);
});

test('webhook: no event-id header falls back to a body hash, so replay is still caught', async () => {
  const { store, calls } = fakeStore();
  const raw = body('payment.captured');
  const input = { rawBody: raw, signature: signWebhookBody(raw, SECRET), eventId: undefined, secret: SECRET };
  assert.equal((await processWebhook(input, store)).outcome, 'processed');
  assert.equal((await processWebhook(input, store)).outcome, 'replayed');
  assert.equal(calls.settled.length, 1);
});

test('webhook: failure while settling forgets the event id so the gateway retry is processed', async () => {
  const bad = fakeStore({ failSettle: true });
  const raw = body('payment.captured');
  await assert.rejects(call(raw, bad.store), /db down/);
  assert.equal(bad.seen.size, 0);
  const good = fakeStore();
  good.seen.add('nothing'); // unrelated state
  assert.equal((await call(raw, good.store)).outcome, 'processed');
});

test('webhook: payment.failed only notes the failure; unknown events are ignored (200)', async () => {
  const { store, calls, seen } = fakeStore();
  assert.deepEqual(await call(body('payment.failed', 'pay_f'), store, { eventId: 'evt_f' }), { outcome: 'processed', bookingConfirmed: false });
  assert.deepEqual(calls.failed, ['pay_f']);
  assert.deepEqual(calls.settled, []);
  assert.deepEqual(await call(body('refund.created'), store, { eventId: 'evt_x' }), { outcome: 'ignored' });
  assert.equal(seen.has('evt_x'), false);
});

test('webhook: body that is not JSON (but correctly signed) -> 400', async () => {
  const { store } = fakeStore();
  const raw = Buffer.from('not json');
  await assert.rejects(call(raw, store), { statusCode: 400, code: 'INVALID_PAYLOAD' });
});

test('validation: client can never send an amount; ids and fields are required', () => {
  const id = 'a'.repeat(24);
  assert.equal(orderBodySchema.safeParse({ bookingId: id }).success, true);
  assert.equal(orderBodySchema.safeParse({ bookingId: id, amount: 1 }).success, false); // strict: no client amount
  assert.equal(orderBodySchema.safeParse({}).success, false); // missing field
  assert.equal(orderBodySchema.safeParse({ bookingId: 'nope' }).success, false);
  assert.equal(orderBodySchema.safeParse({ bookingId: id, method: 'cheque' }).success, false);
  assert.equal(orderBodySchema.safeParse({ bookingId: id, method: 'cod' }).success, true);
  const v = { bookingId: id, razorpay_order_id: 'o', razorpay_payment_id: 'p', razorpay_signature: 's' };
  assert.equal(verifyBodySchema.safeParse(v).success, true);
  assert.equal(verifyBodySchema.safeParse({ ...v, razorpay_signature: undefined }).success, false);
});

test('cash-on-service bookings can pay online until the job is finished or cancelled', () => {
  for (const s of ['confirmed', 'searching_for_partner', 'assigned', 'en_route', 'arrived', 'in_progress']) {
    assert.equal(isCodOnlinePayableStatus(s), true, s);
  }
  for (const s of ['pending_payment', 'completed', 'rated', 'cancelled_by_customer', 'cancelled_by_partner', 'no_show', 'disputed']) {
    assert.equal(isCodOnlinePayableStatus(s), false, s);
  }
});