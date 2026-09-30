import crypto from 'crypto';
import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { getRedisClient } from '../../config/redis';
import type { IBooking } from '../../models/Booking';
import { bookingsRepository } from './bookings.repository';
import {
  BOOKING_HOLD_MS,
  BOOKING_STATUS,
  BOOKINGS_SERVICE_CATALOG,
  CONVENIENCE_FEE,
  SERVICE_SLOTS,
  SLOT_CAPACITY,
} from './bookings.constants';
import type { CreateBookingInput } from './bookings.types';

/** How far the server-computed total may drift from the client's last-seen estimate before we
 *  ask the client to refresh instead of silently charging a different amount. */
const PRICE_DRIFT_TOLERANCE = 0;

export interface SlotAvailability { slot: string; available: boolean }

class BookingsService {
  async getSlotsForDate(serviceId: string, date: string): Promise<SlotAvailability[]> {
    this.assertServiceExists(serviceId);
    this.assertNotPastDate(date);

    const counts = await Promise.all(
      SERVICE_SLOTS.map((slot) => bookingsRepository.countActiveForSlot(serviceId, date, slot)),
    );
    return SERVICE_SLOTS.map((slot, i) => ({ slot, available: counts[i] < SLOT_CAPACITY }));
  }

  async createBooking(
    customerId: string,
    idempotencyKey: string,
    input: CreateBookingInput,
  ): Promise<{ booking: IBooking; replayed: boolean }> {
    const catalogService = this.assertServiceExists(input.serviceId);
    this.assertNotPastDate(input.date);

    const requestHash = this.hashRequest(customerId, input);

    // Idempotency: same customer + key -> return the original result instead of creating twice.
    const existing = await bookingsRepository.findByCustomerAndIdempotencyKey(customerId, idempotencyKey);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new AppError(409, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used with a different request');
      }
      return { booking: existing, replayed: true };
    }

    const addressSnapshot = this.resolveAddressSnapshot(input);
    const priceSnapshot = this.computePriceSnapshot(catalogService, input);

    if (input.expectedTotal !== undefined && Math.abs(input.expectedTotal - priceSnapshot.total) > PRICE_DRIFT_TOLERANCE) {
      throw new AppError(409, 'PRICE_CHANGED', 'The price has changed since your last estimate. Please review and try again.', {
        expectedTotal: input.expectedTotal,
        currentTotal: priceSnapshot.total,
      });
    }

    const booking = await this.withSlotLock(input.serviceId, input.date, input.slot, async () => {
      const seat = await bookingsRepository.findFreeSeat(input.serviceId, input.date, input.slot, SLOT_CAPACITY);
      if (seat === null) {
        throw new AppError(409, 'SLOT_UNAVAILABLE', 'That slot just filled up. Please pick another.');
      }

      const now = new Date();
      const history = [
        {
          from: null,
          to: BOOKING_STATUS.PENDING_PAYMENT,
          at: now,
          actorId: new Types.ObjectId(customerId),
          actorRole: 'customer' as const,
        },
      ];

      try {
        return await bookingsRepository.create({
          customerId: new Types.ObjectId(customerId),
          serviceId: new Types.ObjectId(input.serviceId),
          quantity: input.quantity,
          addOns: input.addOns.map((a) => ({ addOnId: new Types.ObjectId(a.addOnId), quantity: a.quantity })),
          addressSnapshot,
          date: input.date,
          slot: input.slot,
          priceSnapshot: {
            ...priceSnapshot,
            lines: priceSnapshot.lines.map((l) => ({ ...l, refId: new Types.ObjectId(String(l.refId)) })),
          },
          status: BOOKING_STATUS.PENDING_PAYMENT,
          history,
          slotSeat: seat,
          idempotencyKey,
          requestHash,
          holdExpiresAt: new Date(now.getTime() + BOOKING_HOLD_MS),
        });
      } catch (err) {
        // Unique-index race: another request took this (service,date,slot,seat) or this
        // (customer,idempotencyKey) between our read and write. Both are conflicts, not bugs.
        if (this.isDuplicateKeyError(err)) {
          const replay = await bookingsRepository.findByCustomerAndIdempotencyKey(customerId, idempotencyKey);
          if (replay) return replay;
          throw new AppError(409, 'SLOT_UNAVAILABLE', 'That slot just filled up. Please pick another.');
        }
        throw err;
      }
    });

    return { booking, replayed: false };
  }

  async getBookingForCustomer(bookingId: string, customerId: string): Promise<IBooking> {
    const booking = await bookingsRepository.findByIdForCustomer(bookingId, customerId);
    if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    return booking;
  }

  // ---- internals ----

  private assertServiceExists(serviceId: string) {
    const service = BOOKINGS_SERVICE_CATALOG.getById(serviceId);
    if (!service) throw new AppError(404, 'SERVICE_NOT_FOUND', 'This service is not available');
    return service;
  }

  private assertNotPastDate(date: string) {
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) throw new AppError(400, 'INVALID_DATE', 'Date must be today or later');
  }

  private resolveAddressSnapshot(input: CreateBookingInput) {
    if (input.newAddress) return input.newAddress;
    // No Addresses module/collection exists yet (separate issue). Once it does, look up
    // input.addressId here and return its snapshot instead of this 501.
    throw new AppError(
      501,
      'ADDRESS_LOOKUP_UNAVAILABLE',
      'Booking by saved addressId is not available yet — pass "newAddress" with the full address until the Addresses API ships.',
    );
  }

  private computePriceSnapshot(catalogService: ReturnType<typeof BOOKINGS_SERVICE_CATALOG.getById>, input: CreateBookingInput) {
    if (!catalogService) throw new AppError(404, 'SERVICE_NOT_FOUND', 'This service is not available');

    const lines: Array<{
      kind: 'BASE' | 'ADDON';
      refId: string;
      name: string;
      unitPrice: number;
      quantity: number;
      amount: number;
    }> = [
      {
        kind: 'BASE',
        refId: catalogService.id,
        name: catalogService.name,
        unitPrice: catalogService.basePrice,
        quantity: input.quantity,
        amount: catalogService.basePrice * input.quantity,
      },
    ];

    for (const requested of input.addOns) {
      const addOn = catalogService.addOns.find((a) => a.id === requested.addOnId);
      if (!addOn) throw new AppError(400, 'VALIDATION_ERROR', `Unknown add-on for this service: ${requested.addOnId}`);
      lines.push({
        kind: 'ADDON',
        refId: addOn.id,
        name: addOn.name,
        unitPrice: addOn.price,
        quantity: requested.quantity,
        amount: addOn.price * requested.quantity,
      });
    }

    const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
    // Coupons live in a separate module; treat any code as "not recognized" for now rather than
    // silently discounting or pretending success.
    const discount = 0;
    const total = Math.max(0, subtotal - discount) + CONVENIENCE_FEE;

    return {
      currency: 'INR' as const,
      lines,
      subtotal,
      discount,
      couponCode: input.couponCode,
      convenienceFee: CONVENIENCE_FEE,
      total,
      computedAt: new Date(),
    };
  }

  private hashRequest(customerId: string, input: CreateBookingInput): string {
    const stable = JSON.stringify({
      customerId,
      serviceId: input.serviceId,
      quantity: input.quantity,
      addOns: [...input.addOns].sort((a, b) => a.addOnId.localeCompare(b.addOnId)),
      addressId: input.addressId,
      newAddress: input.newAddress,
      date: input.date,
      slot: input.slot,
      couponCode: input.couponCode,
    });
    return crypto.createHash('sha256').update(stable).digest('hex');
  }

  private isDuplicateKeyError(err: unknown): boolean {
    return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
  }

  /** Redis-backed lock on (service,date,slot) so two concurrent requests don't both read "seat
   *  free" before either writes. Falls back to running unlocked (relying solely on the Mongo
   *  unique index) if Redis is unavailable — correctness holds either way, this only removes the
   *  extra fast-fail-fast retry-avoidance layer. */
  private async withSlotLock<T>(serviceId: string, date: string, slot: string, fn: () => Promise<T>): Promise<T> {
    const redis = await getRedisClient();
    if (!redis) return fn();

    const lockKey = `lock:slot:${serviceId}:${date}:${slot}`;
    const token = crypto.randomUUID();
    const acquired = await redis.set(lockKey, token, { NX: true, PX: 5000 });
    if (!acquired) {
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'That slot is being booked by someone else right now. Please try again.');
    }
    try {
      return await fn();
    } finally {
      // Only release if we still own the lock (best-effort; a short PX bounds the blast radius).
      const current = await redis.get(lockKey).catch(() => null);
      if (current === token) await redis.del(lockKey).catch(() => undefined);
    }
  }
}

export const bookingsService = new BookingsService();
