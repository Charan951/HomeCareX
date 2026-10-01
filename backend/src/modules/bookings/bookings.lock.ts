import { randomUUID } from 'crypto';
import { getRedisClient } from '../../config/redis';
import { AppError } from '../../utils/AppError';
import { BOOKING_LOCK_TTL_MS, BOOKING_LOCK_WAIT_MS } from './bookings.constants';

/** In-process FIFO mutex per key: serialises seat picking inside this Node process even when
 *  Redis is unavailable. */
const localTails = new Map<string, Promise<void>>();

async function withLocalLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previous = localTails.get(key) ?? Promise.resolve();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const tail = previous.then(() => gate);
  localTails.set(key, tail);
  await previous;
  try {
    return await fn();
  } finally {
    release();
    if (localTails.get(key) === tail) localTails.delete(key);
  }
}

const RELEASE_SCRIPT = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) else return 0 end`;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn` while holding a lock on `key`.
 *  - Redis (SET NX PX) coordinates multiple API instances; released only by its owner (Lua compare-and-del).
 *  - If Redis is not configured/reachable we degrade to the in-process mutex. Either way the unique
 *    index (service, date, slot, seat) on the Booking model is the final guarantee against double-booking.
 */
export async function withSlotLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  return withLocalLock(key, async () => {
    // Never let a slow/unreachable Redis stall a booking: give up on it after a short wait.
    const redis = await Promise.race([
      getRedisClient().catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
    ]);
    if (!redis) return fn();

    const lockKey = `lock:${key}`;
    const token = randomUUID();
    const deadline = Date.now() + BOOKING_LOCK_WAIT_MS;
    let acquired = false;

    try {
      while (!acquired) {
        acquired = (await redis.set(lockKey, token, { NX: true, PX: BOOKING_LOCK_TTL_MS })) === 'OK';
        if (acquired) break;
        if (Date.now() >= deadline) {
          throw new AppError(409, 'SLOT_BUSY', 'That slot is being booked right now. Please try again in a moment.');
        }
        await sleep(50);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      // Redis hiccup while acquiring: fall back to the unique index + local mutex.
      return fn();
    }

    try {
      return await fn();
    } finally {
      await redis.eval(RELEASE_SCRIPT, { keys: [lockKey], arguments: [token] }).catch(() => undefined);
    }
  });
}