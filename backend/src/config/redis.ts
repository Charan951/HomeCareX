// Backend Config: redis
import { createClient } from 'redis';
import { environmentConfig } from './environment';

export const redisConfig = {};

type RedisClient = ReturnType<typeof createClient>;

let clientPromise: Promise<RedisClient | null> | null = null;

/**
 * Lazily connects one shared Redis client.
 * Resolves to `null` when REDIS_URL is unset or Redis is unreachable, so callers can degrade
 * gracefully (the booking module falls back to an in-process lock; MongoDB's unique index is
 * still the hard guarantee against double-booking).
 */
export function getRedisClient(): Promise<RedisClient | null> {
  const url = environmentConfig.redisUrl;
  if (!url) return Promise.resolve(null);

  if (!clientPromise) {
    clientPromise = (async () => {
      const client = createClient({
        url,
        // Fail fast instead of queueing commands while disconnected.
        disableOfflineQueue: true,
        socket: { connectTimeout: 2000, reconnectStrategy: (retries) => Math.min(retries * 200, 5000) },
      });
      client.on('error', (err: Error) => console.error('[redis]', err.message));
      try {
        await client.connect();
        return client;
      } catch (err) {
        console.error('[redis] connect failed, continuing without Redis:', (err as Error).message);
        clientPromise = null; // allow a later retry
        return null;
      }
    })();
  }
  return clientPromise;
}
