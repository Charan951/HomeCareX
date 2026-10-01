import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import http, { type Server as HttpServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Types } from 'mongoose';
import jwt from 'jsonwebtoken';
import { io as connect, type Socket } from 'socket.io-client';

process.env.JWT_SECRET = 'test_secret';

/* eslint-disable @typescript-eslint/no-require-imports */
const { initSockets, rooms, emitToUser } = require('./index') as typeof import('./index');
const BookingModel = (require('../models/Booking') as typeof import('../models/Booking')).default;
const PartnerModel = (require('../models/Partner') as typeof import('../models/Partner')).default;
/* eslint-enable @typescript-eslint/no-require-imports */

const partnerUser = new Types.ObjectId().toString();
const customerUser = new Types.ObjectId().toString();
const adminUser = new Types.ObjectId().toString();
const strangerUser = new Types.ObjectId().toString();
const partnerDocId = new Types.ObjectId();
const myBooking = new Types.ObjectId().toString();
const otherBooking = new Types.ObjectId().toString();

const tok = (role: string, sub: string, secret = 'test_secret') => jwt.sign({ sub, role }, secret, { expiresIn: '5m' });

let httpServer: HttpServer;
let url: string;
const open: Socket[] = [];

/** Connects and resolves with the socket once connected, or rejects with the server's error. */
const connectWith = (auth?: Record<string, string>, headers?: Record<string, string>) =>
  new Promise<Socket>((resolve, reject) => {
    const s = connect(url, { auth, extraHeaders: headers, transports: ['websocket'], reconnection: false, forceNew: true });
    open.push(s);
    s.on('connect', () => resolve(s));
    s.on('connect_error', (e: Error & { data?: { code?: string } }) => reject(Object.assign(e, { code: e.data?.code })));
  });

const join = (s: Socket, bookingId: string) =>
  new Promise<{ ok: boolean; code?: string }>((resolve) => s.emit('booking:join', { bookingId }, resolve));

describe('Socket.IO server', () => {
  before(async () => {
    // Stub the DB: partnerUser owns partnerDocId, which is assigned to myBooking; customerUser owns myBooking too.
    (PartnerModel as unknown as { findOne: unknown }).findOne = (q: { userId: string }) => ({
      select: () => ({ lean: async () => (q.userId === partnerUser ? { _id: partnerDocId } : null) }),
    });
    (BookingModel as unknown as { exists: unknown }).exists = async (q: Record<string, unknown>) => {
      if (q._id === otherBooking) return q.customerId || q.partnerId ? null : { _id: otherBooking };
      if (q._id !== myBooking) return null;
      if (q.customerId) return q.customerId === customerUser ? { _id: myBooking } : null;
      if (q.partnerId) return String(q.partnerId) === String(partnerDocId) ? { _id: myBooking } : null;
      return { _id: myBooking };
    };
    httpServer = http.createServer();
    initSockets(httpServer);
    await new Promise<void>((r) => httpServer.listen(0, r));
    url = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
  });
  after(() => {
    open.forEach((s) => s.close());
    httpServer.close();
  });

  describe('JWT handshake', () => {
    it('rejects a connection with no token (NO_ACCESS_TOKEN)', async () => {
      await assert.rejects(connectWith(), (e: { code?: string }) => e.code === 'NO_ACCESS_TOKEN');
    });
    it('rejects a garbage token (INVALID_ACCESS_TOKEN)', async () => {
      await assert.rejects(connectWith({ token: 'nope' }), (e: { code?: string }) => e.code === 'INVALID_ACCESS_TOKEN');
    });
    it('rejects a token signed with the wrong secret', async () => {
      await assert.rejects(connectWith({ token: tok('partner', partnerUser, 'other') }), (e: { code?: string }) => e.code === 'INVALID_ACCESS_TOKEN');
    });
    it('rejects an expired token', async () => {
      const expired = jwt.sign({ sub: partnerUser, role: 'partner' }, 'test_secret', { expiresIn: -10 });
      await assert.rejects(connectWith({ token: expired }), (e: { code?: string }) => e.code === 'INVALID_ACCESS_TOKEN');
    });
    for (const [role, sub] of [['customer', customerUser], ['partner', partnerUser], ['admin', adminUser]] as const) {
      it(`accepts a valid ${role} token`, async () => {
        const s = await connectWith({ token: tok(role, sub) });
        assert.equal(s.connected, true);
      });
    }
    it('accepts a Bearer Authorization header', async () => {
      const s = await connectWith(undefined, { Authorization: `Bearer ${tok('partner', partnerUser)}` });
      assert.equal(s.connected, true);
    });
  });

  describe('user rooms', () => {
    it('delivers user-targeted events only to that user', async () => {
      const mine = await connectWith({ token: tok('partner', partnerUser) });
      const other = await connectWith({ token: tok('customer', strangerUser) });
      const got: string[] = [];
      mine.on('ping', () => got.push('mine'));
      other.on('ping', () => got.push('other'));
      await new Promise((r) => setTimeout(r, 50)); // let both sockets finish joining their rooms
      emitToUser(partnerUser, 'ping', {});
      await new Promise((r) => setTimeout(r, 100));
      assert.deepEqual(got, ['mine']);
    });
    it('exposes room name helpers', () => {
      assert.equal(rooms.user('1'), 'user:1');
      assert.equal(rooms.booking('2'), 'booking:2');
    });
  });

  describe('booking rooms (ownership check)', () => {
    it('customer can join their own booking', async () => {
      const s = await connectWith({ token: tok('customer', customerUser) });
      assert.deepEqual(await join(s, myBooking), { ok: true });
    });
    it('partner can join a booking assigned to them', async () => {
      const s = await connectWith({ token: tok('partner', partnerUser) });
      assert.deepEqual(await join(s, myBooking), { ok: true });
    });
    it('admin can join any existing booking', async () => {
      const s = await connectWith({ token: tok('admin', adminUser) });
      assert.deepEqual(await join(s, myBooking), { ok: true });
    });
    it('another customer is refused (RESOURCE_FORBIDDEN)', async () => {
      const s = await connectWith({ token: tok('customer', strangerUser) });
      const res = await join(s, myBooking);
      assert.equal(res.ok, false);
      assert.equal(res.code, 'RESOURCE_FORBIDDEN');
    });
    it('a partner not assigned to the booking is refused', async () => {
      const s = await connectWith({ token: tok('partner', strangerUser) });
      assert.equal((await join(s, myBooking)).ok, false);
    });
    it('a booking that is not theirs is refused', async () => {
      const s = await connectWith({ token: tok('partner', partnerUser) });
      assert.equal((await join(s, otherBooking)).code, 'RESOURCE_FORBIDDEN');
    });
    it('malformed bookingId gets VALIDATION_ERROR', async () => {
      const s = await connectWith({ token: tok('customer', customerUser) });
      assert.equal((await join(s, 'abc')).code, 'VALIDATION_ERROR');
    });
  });
});