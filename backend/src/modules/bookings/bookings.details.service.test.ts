import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { bookingsRepository } from './bookings.repository';
import { BookingService } from './bookings.service';

/** The repository is swapped for a stub so these tests need no database. */
type Repo = typeof bookingsRepository;
const original = {
  findByIdForCustomer: bookingsRepository.findByIdForCustomer,
  getOrCreateStartOtp: bookingsRepository.getOrCreateStartOtp,
  decideExtraCharge: bookingsRepository.decideExtraCharge,
};
afterEach(() => Object.assign(bookingsRepository, original));

const stub = (patch: Partial<Record<keyof typeof original, unknown>>) => Object.assign(bookingsRepository as Repo, patch);

const doc = (over: Record<string, unknown> = {}) => ({
  _id: 'b1',
  status: 'confirmed',
  partnerEarning: 500,
  extraCharges: [],
  ...over,
});

test("someone else's (or a missing) booking is a 404", async () => {
  stub({ findByIdForCustomer: async () => null });
  await assert.rejects(() => BookingService.getBooking('c1', 'b1'), { statusCode: 404, code: 'BOOKING_NOT_FOUND' });
});

test('the start OTP is only requested once the partner has arrived', async () => {
  let otpCalls = 0;
  stub({
    findByIdForCustomer: async () => doc({ status: 'en_route' }),
    getOrCreateStartOtp: async () => {
      otpCalls++;
      return '1234';
    },
  });
  const early = await BookingService.getBooking('c1', 'b1');
  assert.equal(early.startOtp, null);
  assert.equal(otpCalls, 0);

  stub({
    findByIdForCustomer: async () => doc({ status: 'arrived' }),
    getOrCreateStartOtp: async () => '1234',
  });
  const arrived = await BookingService.getBooking('c1', 'b1');
  assert.equal(arrived.startOtp, '1234');
  assert.equal('partnerEarning' in arrived, false);
});

test('deciding a charge returns the refreshed booking on success', async () => {
  stub({
    decideExtraCharge: async () => doc(),
    findByIdForCustomer: async () => doc({ status: 'in_progress', extraCharges: [{ _id: 'x1', title: 't', amount: 200, status: 'approved' }] }),
  });
  const view = await BookingService.decideExtraCharge('c1', 'b1', 'x1', 'approve');
  assert.equal(view.extraChargesApprovedTotal, 200);
});

test('a refused decision explains why', async () => {
  const none = async () => null;

  stub({ decideExtraCharge: none, findByIdForCustomer: none });
  await assert.rejects(() => BookingService.decideExtraCharge('c1', 'b1', 'x1', 'approve'), { statusCode: 404, code: 'BOOKING_NOT_FOUND' });

  stub({ decideExtraCharge: none, findByIdForCustomer: async () => doc({ status: 'in_progress', extraCharges: [] }) });
  await assert.rejects(() => BookingService.decideExtraCharge('c1', 'b1', 'x1', 'approve'), { statusCode: 404, code: 'EXTRA_CHARGE_NOT_FOUND' });

  stub({
    decideExtraCharge: none,
    findByIdForCustomer: async () => doc({ status: 'in_progress', extraCharges: [{ _id: 'x1', title: 't', amount: 5, status: 'approved' }] }),
  });
  await assert.rejects(() => BookingService.decideExtraCharge('c1', 'b1', 'x1', 'reject'), { statusCode: 409, code: 'EXTRA_CHARGE_ALREADY_DECIDED' });

  stub({
    decideExtraCharge: none,
    findByIdForCustomer: async () => doc({ status: 'assigned', extraCharges: [{ _id: 'x1', title: 't', amount: 5, status: 'pending' }] }),
  });
  await assert.rejects(() => BookingService.decideExtraCharge('c1', 'b1', 'x1', 'approve'), { statusCode: 409, code: 'INVALID_STATE_TRANSITION' });
});

test('approve/reject map to the stored statuses', async () => {
  const seen: string[] = [];
  stub({
    decideExtraCharge: async (_b: string, _c: string, _x: string, decision: string) => {
      seen.push(decision);
      return doc();
    },
    findByIdForCustomer: async () => doc(),
  });
  await BookingService.decideExtraCharge('c1', 'b1', 'x1', 'approve');
  await BookingService.decideExtraCharge('c1', 'b1', 'x1', 'reject');
  assert.deepEqual(seen, ['approved', 'rejected']);
});