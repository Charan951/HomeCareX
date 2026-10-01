// Backend Config: redis
import { createClient } from 'redis';
import { environmentConfig } from './environment';

export const redisConfig = {};

type RedisClient = ReturnType<typeof createClient>;

let clientPromise: Promise<RedisClient | null> | null = null;
/** After a failed connect, don't retry for a while: requests fall straight back to no-Redis mode. */
let retryAfter = 0;
const RETRY_COOLDOWN_MS = 30_000;
let warned = false;

/**
 * Lazily connects one shared Redis client.
 * Resolves to `null` when REDIS_URL is unset or Redis is unreachable, so callers can degrade
 * gracefully (the booking module falls back to an in-process lock; MongoDB's unique index is
 * still the hard guarantee against double-booking). The first connect attempt fails fast
 * (it never hangs a request); once connected, dropped connections reconnect with backoff.
 */
export function getRedisClient(): Promise<RedisClient | null> {
  const url = environmentConfig.redisUrl;
  if (!url) return Promise.resolve(null);
  if (Date.now() < retryAfter) return Promise.resolve(null);

  if (!clientPromise) {
    clientPromise = (async () => {
      let everConnected = false;
      const client = createClient({
        url,
        // Fail fast instead of queueing commands while disconnected.
        disableOfflineQueue: true,
        socket: {
          connectTimeout: 2000,
          reconnectStrategy: (retries) => {
            // Never connected: give up immediately so connect() rejects and callers fall back.
            if (!everConnected) return new Error('Redis unreachable');
            return Math.min(retries * 200, 5000);
          },
        },
      });
      client.on('ready', () => {
        everConnected = true;
        warned = false;
      });
      client.on('error', (err: Error) => {
        // Log once per outage (the message is often empty for AggregateError, so fall back to code/name).
        if (warned) return;
        warned = true;
        const e = err as Error & { code?: string };
        console.error('[redis]', e.message || e.code || e.name || 'connection error');
      });
      try {
        await client.connect();
        return client;
      } catch (err) {
        const e = err as Error & { code?: string };
        console.error('[redis] connect failed, continuing without Redis:', e.message || e.code || 'unreachable');
        retryAfter = Date.now() + RETRY_COOLDOWN_MS;
        clientPromise = null; // allow a later retry (after the cooldown)
        client.disconnect().catch(() => undefined);
        return null;
      }
    })();
  }
  return clientPromise;
}