import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOOKING_STATUSES } from './bookings.constants';
import { allowedNextStatuses, applyTransition, assertTransition, canTransition, isTerminal, TRANSITIONS } from './bookings.stateMachine';

test('happy path is allowed for the right actors', () => {
  assert.ok(canTransition('created', 'searching_for_partner', 'system'));
  assert.ok(canTransition('searching_for_partner', 'assigned', 'partner'));
  assert.ok(canTransition('assigned', 'en_route', 'partner'));
  assert.ok(canTransition('in_progress', 'completed', 'partner'));
  assert.ok(canTransition('completed', 'rated', 'customer'));
});

test('illegal jumps throw INVALID_STATE_TRANSITION (409)', () => {
  assert.throws(() => assertTransition('created', 'completed', 'partner'), { status: 409, code: 'INVALID_STATE_TRANSITION' });
  assert.throws(() => assertTransition('completed', 'en_route', 'partner'), { status: 409 });
});

test('wrong actor throws FORBIDDEN (403)', () => {
  assert.throws(() => assertTransition('assigned', 'en_route', 'customer'), { status: 403, code: 'FORBIDDEN' });
});

test('partner cancellation can auto-reassign', () => {
  assert.ok(canTransition('cancelled_by_partner', 'searching_for_partner', 'system'));
});

test('applyTransition updates status and appends history', () => {
  const booking = { status: 'assigned' as const, statusHistory: [] as Parameters<typeof applyTransition>[0]['statusHistory'] };
  const entry = applyTransition(booking, 'en_route', { role: 'partner', id: 'p1' });
  assert.equal(booking.status, 'en_route');
  assert.equal(booking.statusHistory.length, 1);
  assert.equal(entry.from, 'assigned');
});

test('every status has an entry and terminal states have no exits', () => {
  for (const s of BOOKING_STATUSES) assert.ok(s in TRANSITIONS, `${s} missing`);
  assert.ok(isTerminal('cancelled_by_customer'));
  assert.deepEqual(allowedNextStatuses('cancelled_by_customer'), []);
});