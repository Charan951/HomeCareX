import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calculatePricing } from './pricing.service';

const lines = (...amounts: number[]) => amounts.map((amount) => ({ amount }));

test('evening slot adds 10% surge, then fee and GST (the ₹1,331 case)', () => {
  const p = calculatePricing({ lines: lines(999), slot: '18:00-20:00' });
  assert.equal(p.surge, 100);
  assert.equal(p.surgeLabel, 'Evening demand');
  assert.equal(p.subtotal, 1099);
  assert.equal(p.convenienceFee, 29);
  assert.equal(p.gst, 203);
  assert.equal(p.total, 1331);
});

test('daytime slot has no surge', () => {
  const p = calculatePricing({ lines: lines(999), slot: '08:00-10:00' });
  assert.equal(p.surge, 0);
  assert.equal(p.surgeLabel, undefined);
  assert.equal(p.subtotal, 999);
  assert.equal(p.gst, 185);
  assert.equal(p.total, 1213);
});

test('add-ons are included in the surge base', () => {
  const p = calculatePricing({ lines: lines(599, 400), slot: '18:00-20:00' });
  assert.equal(p.addOnsTotal, 400);
  assert.equal(p.surge, 100); // 10% of 999, rounded
  assert.equal(p.total, p.subtotal - p.discount + p.convenienceFee + p.gst);
});