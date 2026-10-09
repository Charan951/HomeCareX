import { describe, expect, it } from 'vitest';
import { bookingCode, mapJob } from '@/pages/partner/JobDetails/jobDetails.mapper';
import type { ApiJob } from '@/pages/partner/JobDetails/jobDetails.types';
import { LIFECYCLE, STATUS_LABEL, isCancelled, isFinished } from '@/pages/partner/JobDetails/jobStatus';

const api: ApiJob = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  status: 'assigned',
  customer: { name: 'Rahul K.', phone: '******3210' },
  service: { name: 'AC Service', quantity: 1, durationMinutes: 90 },
  location: { line1: '12 MG Road', area: 'Madhapur', city: 'Hyderabad', pincode: '500081', coordinates: null },
  schedule: { scheduledAt: '2026-10-08T04:30:00.000Z', date: '2026-10-08', slot: '10:00-12:00', startedAt: null },
  price: { currency: 'INR', total: 599, partnerEarning: 450 },
  addOns: [{ name: 'Eco chemicals', quantity: 1, amount: 50 }],
  instructions: null,
  checklist: [{ id: 'inc-1', label: 'Filter cleaning', done: false }],
  payment: { status: 'PAID', paidAt: null },
  actions: [{ status: 'en_route', label: 'On the way' }],
  otpRequired: false,
  statusHistory: [{ from: 'searching_for_partner', to: 'assigned', at: '2026-10-07T10:00:00.000Z', actorRole: 'system', actorId: null, reason: null }],
};

describe('mapJob', () => {
  it('maps the API shape to the page model', () => {
    const job = mapJob(api);
    expect(job.bookingCode).toBe('#B9C0D1');
    expect(job.customer).toEqual({ name: 'Rahul K.', phoneMasked: '******3210' });
    expect(job.location.address).toBe('12 MG Road, Madhapur');
    expect(job.payment).toEqual({ status: 'PAID', amount: 599 });
    expect(job.addOns[0]).toMatchObject({ name: 'Eco chemicals', amount: 50 });
    expect(job.history).toEqual([{ status: 'assigned', at: '2026-10-07T10:00:00.000Z', actor: 'System' }]);
  });

  it('keeps the server actions untouched (the server decides which buttons exist)', () => {
    expect(mapJob(api).actions).toEqual([{ status: 'en_route', label: 'On the way' }]);
    expect(mapJob({ ...api, status: 'arrived', actions: [], otpRequired: true })).toMatchObject({
      actions: [],
      otpRequired: true,
    });
  });

  it('shows a dash when the phone is missing', () => {
    expect(mapJob({ ...api, customer: { name: 'Asha', phone: null } }).customer.phoneMasked).toBe('—');
  });
});

describe('status helpers', () => {
  it('bookingCode uses the last 6 characters of the id', () => {
    expect(bookingCode('aaaaaaaaaaaaaaaaaaaa123abc')).toBe('#123ABC');
  });
  it('every lifecycle step has a label and the order matches the backend', () => {
    expect(LIFECYCLE).toEqual(['assigned', 'en_route', 'arrived', 'in_progress', 'completed']);
    LIFECYCLE.forEach((s) => expect(STATUS_LABEL[s]).toBeTruthy());
  });
  it('classifies cancelled and finished jobs', () => {
    expect(isCancelled('cancelled_by_partner')).toBe(true);
    expect(isCancelled('arrived')).toBe(false);
    expect(isFinished('rated')).toBe(true);
    expect(isFinished('in_progress')).toBe(false);
  });
});
