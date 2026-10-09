import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, test } from 'node:test';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './error.middleware';
import { rateLimit } from './rateLimit.middleware';
import { HttpError } from '../modules/auth/auth.types';

let base = '';
let closeServer: () => Promise<void> = async () => undefined;
const originalEnv = process.env.NODE_ENV;

  const allowedOrigins = ['http://localhost:3000', 'http://localhost:5173'];

  before(async () => {
    const app = express();

    app.use(helmet());

    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(new HttpError(403, 'CORS origin not allowed', 'CORS_FORBIDDEN'));
        },
        credentials: true,
      }),
    );

    app.use(
      express.json({
        limit: '1mb',
      }),
    );

    app.use(
      express.urlencoded({
        extended: true,
        limit: '1mb',
      }),
    );

    // Test routes
    app.get('/test/health', (_req, res) => {
      res.json({ success: true, message: 'ok' });
    });

    app.get('/test/simulate-500', (_req, _res) => {
      throw new Error('Secret DB connection error with password credentials!');
    });

    app.get('/test/simulate-http-500', (_req, _res) => {
      throw new HttpError(500, 'Internal secret failure');
    });

    const testLimiter = rateLimit({ windowMs: 10_000, max: 2 });
    app.post('/test/limited', testLimiter, (_req, res) => {
      res.json({ success: true, count: 'ok' });
    });

    app.use(notFoundHandler);
    app.use(errorHandler);

    const server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    closeServer = () => new Promise((r) => server.close(() => r()));
  });

  after(async () => {
    process.env.NODE_ENV = originalEnv;
    await closeServer();
  });

  test('Simulated 500 in production never exposes stack trace or raw exception details', async () => {
    process.env.NODE_ENV = 'production';
    const res = await fetch(`${base}/test/simulate-500`);
    assert.equal(res.status, 500);
    const body = (await res.json()) as Record<string, unknown>;

    assert.equal(body.success, false);
    assert.equal(body.code, 'INTERNAL_ERROR');
    assert.equal(body.message, 'Something went wrong. Please try again.');
    assert.equal(body.stack, undefined);
    assert.ok(!JSON.stringify(body).includes('Secret DB connection error'));
  });

  test('Simulated HttpError 500 in production sanitizes message and strips details', async () => {
    process.env.NODE_ENV = 'production';
    const res = await fetch(`${base}/test/simulate-http-500`);
    assert.equal(res.status, 500);
    const body = (await res.json()) as Record<string, unknown>;

    assert.equal(body.success, false);
    assert.equal(body.code, 'INTERNAL_ERROR');
    assert.equal(body.message, 'Something went wrong. Please try again.');
    assert.equal(body.stack, undefined);
    assert.ok(!JSON.stringify(body).includes('Internal secret failure'));
  });

  test('Simulated 500 in development includes stack trace', async () => {
    process.env.NODE_ENV = 'development';
    const res = await fetch(`${base}/test/simulate-500`);
    assert.equal(res.status, 500);
    const body = (await res.json()) as Record<string, unknown>;

    assert.equal(body.success, false);
    assert.equal(body.code, 'INTERNAL_ERROR');
    assert.ok(typeof body.stack === 'string');
  });

  test('Malformed JSON produces safe HTTP 400 with INVALID_JSON code', async () => {
    const res = await fetch(`${base}/test/limited`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"invalid": json here',
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(body.code, 'INVALID_JSON');
    assert.equal(body.message, 'Request body is not valid JSON');
  });

  test('Oversized request body produces HTTP 413 PAYLOAD_TOO_LARGE', async () => {
    // Generate a payload over 1MB
    const bigString = 'x'.repeat(1024 * 1024 + 100);
    const res = await fetch(`${base}/test/limited`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: bigString }),
    });
    assert.equal(res.status, 413);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(body.code, 'PAYLOAD_TOO_LARGE');
    assert.equal(body.message, 'Request body is too large');
  });

  test('Disallowed CORS origin is rejected with HTTP 403 CORS_FORBIDDEN', async () => {
    const res = await fetch(`${base}/test/health`, {
      headers: { Origin: 'http://malicious-attacker.com' },
    });
    assert.equal(res.status, 403);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(body.code, 'CORS_FORBIDDEN');
  });

  test('Allowed CORS origin succeeds with credentials and Access-Control-Allow-Origin', async () => {
    const res = await fetch(`${base}/test/health`, {
      headers: { Origin: 'http://localhost:3000' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), 'http://localhost:3000');
    assert.equal(res.headers.get('access-control-allow-credentials'), 'true');
  });

  test('Rate limiting triggers 429 RATE_LIMITED and sends Retry-After header', async () => {
    // Request 1: OK
    const r1 = await fetch(`${base}/test/limited`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(r1.status, 200);

    // Request 2: OK
    const r2 = await fetch(`${base}/test/limited`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(r2.status, 200);

    // Request 3: Rate limited
    const r3 = await fetch(`${base}/test/limited`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(r3.status, 429);
    assert.ok(r3.headers.get('retry-after') !== null);
    const body = (await r3.json()) as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(body.code, 'RATE_LIMITED');
  });

  test('Unknown URL hits catch-all 404 handler', async () => {
    const res = await fetch(`${base}/some-unknown-path-xyz`);
    assert.equal(res.status, 404);
    const body = (await res.json()) as Record<string, unknown>;
    assert.equal(body.success, false);
    assert.equal(body.code, 'NOT_FOUND');
  });

