import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test_secret';

// Loaded after JWT_SECRET is set.
/* eslint-disable @typescript-eslint/no-require-imports */
const app = require('../../app').default as import('express').Express;
const { partnerDashboardRepository: repo } = require('./partner-dashboard.repository') as typeof import('./partner-dashboard.repository');
/* eslint-enable @typescript-eslint/no-require-imports */

const partnerUserId = new Types.ObjectId().toString();
const partnerId = new Types.ObjectId();
const otherPartnerId = new Types.ObjectId().toString();
const token = (role: string, sub = partnerUserId) => jwt.sign({ sub, role }, 'test_secret', { expiresIn: '5m' });

let server: Server;
let base: string;
const call = (path: string, bearer?: string) =>
  fetch(`${base}/api/v1/partner/dashboard${path}`, { headers: bearer ? { Authorization: `Bearer ${bearer}` } : {} });

describe('GET /partner/dashboard', () => {
  before(async () => {
    // Stub the DB layer: only the caller's own partner document exists.
    repo.findPartnerByUserId = (async (userId: string) =>
      userId === partnerUserId
        ? { _id: partnerId, ratingAvg: 4.6, stats: { offersReceived: 10, offersAccepted: 8, jobsAssigned: 20, jobsCompleted: 19 } }
        : null) as unknown as typeof repo.findPartnerByUserId;
    repo.countOpenOffers = (async () => 3) as unknown as typeof repo.countOpenOffers;
    repo.countScheduled = (async () => 5) as unknown as typeof repo.countScheduled;
    repo.completedToday = (async () => ({ count: 2, earnings: 1234.567 })) as unknown as typeof repo.completedToday;
    repo.findActiveJob = (async () => null) as unknown as typeof repo.findActiveJob;
    server = app.listen(0);
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => server.close());

  it('200: returns the caller\'s own dashboard with every required field', async () => {
    const res = await call('', token('partner'));
    assert.equal(res.status, 200);
    const { success, data } = (await res.json()) as { success: boolean; data: Record<string, unknown> };
    assert.equal(success, true);
    assert.deepEqual(data, {
      newJobs: 3,
      todayJobs: 5,
      completedJobs: 2,
      todayEarnings: 1234.57,
      rating: 4.6,
      acceptanceRate: 80,
      completionRate: 95,
      activeJob: null,
    });
  });

  it('200: accepts partnerId when it is the caller\'s own', async () => {
    const res = await call(`?partnerId=${partnerId.toString()}`, token('partner'));
    assert.equal(res.status, 200);
  });

   it('401 NO_ACCESS_TOKEN: no token', async () => {
    const res = await call('');
    assert.equal(res.status, 401);
    assert.equal(((await res.json()) as { code: string }).code, 'NO_ACCESS_TOKEN');
  });

  it('401: garbage token', async () => {
    assert.equal((await call('', 'not-a-jwt')).status, 401);
  });

  it('403: customer role is rejected', async () => {
    const res = await call('', token('customer'));
    assert.equal(res.status, 403);
  });

  it('403 RESOURCE_FORBIDDEN: another partner\'s id', async () => {
    const res = await call(`?partnerId=${otherPartnerId}`, token('partner'));
    assert.equal(res.status, 403);
    assert.equal(((await res.json()) as { code: string }).code, 'RESOURCE_FORBIDDEN');
  });

  it('400 VALIDATION_ERROR: malformed partnerId', async () => {
    const res = await call('?partnerId=abc', token('partner'));
    assert.equal(res.status, 400);
    assert.equal(((await res.json()) as { code: string }).code, 'VALIDATION_ERROR');
  });

  it('400 VALIDATION_ERROR: unknown query field', async () => {
    assert.equal((await call('?foo=1', token('partner'))).status, 400);
  });

  it('404 PARTNER_NOT_FOUND: partner user without a profile', async () => {
    const res = await call('', token('partner', new Types.ObjectId().toString()));
    assert.equal(res.status, 404);
    assert.equal(((await res.json()) as { code: string }).code, 'PARTNER_NOT_FOUND');
  });
});