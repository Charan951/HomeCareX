import { createHash } from 'crypto';
import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { addressesService, type ResolvedAddress } from '../addresses/addresses.service';
import { bookingsRepository } from './bookings.repository';
import { bookingSettings } from './bookings.settings';
import { withSlotLock } from './bookings.lock';
import {
  BOOKING_HOLD_MS,
  BOOKING_STATUS,
  BOOKING_WINDOW_DAYS,
  BOOKINGS_SERVICE_CATALOG,
  CONVENIENCE_FEE,
  PRICE_CHANGED_TOLERANCE,
  SERVICE_SLOTS,
} from './bookings.constants';
import type { CreateBookingInput, PriceLine, PriceSnapshot } from './bookings.types';
import { addDays, isRealDate, nowInBookingTz, slotStartMinutes } from './bookings.time';
import { BOOKING_PAYMENT_STATUS } from '../../models/Booking';

export interface SlotAvailability {
  slot: string;
  available: boolean;
  remaining: number;
}

export interface SlotsResponse {
  serviceId: string;
  date: string;
  slots: SlotAvailability[];
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function assertBookableDate(date: string): void {
  const now = nowInBookingTz();
  const lastBookable = addDays(now.date, BOOKING_WINDOW_DAYS - 1);
  if (!isRealDate(date) || date < now.date || date > lastBookable) {
    throw new AppError(400, 'INVALID_DATE', `Pick a date between ${now.date} and ${lastBookable}`);
  }
}

function hasSlotStarted(date: string, slot: string): boolean {
  const now = nowInBookingTz();
  return date === now.date && slotStartMinutes(slot) <= now.minutes;
}

function toView(doc: { toObject?: () => Record<string, unknown> } | Record<string, unknown>): Record<string, unknown> {
  const obj =
    typeof (doc as { toObject?: unknown }).toObject === 'function'
      ? (doc as { toObject: () => Record<string, unknown> }).toObject()
      : { ...(doc as Record<string, unknown>) };
  const { requestHash: _h, idempotencyKey: _k, slotSeat: _s, __v: _v, otp: _o, ...rest } = obj;
  return rest;
}

function isDuplicateKey(err: unknown, indexName: string): boolean {
  const e = err as { code?: number; message?: string };
  return e?.code === 11000 && String(e.message ?? '').includes(indexName);
}

export const BookingService = {
  async getAvailableSlots(serviceId: string, date: string): Promise<SlotsResponse> {
    assertBookableDate(date);
    const capacity = await bookingSettings.getSlotCapacity(serviceId);

    const slots = await Promise.all(
      SERVICE_SLOTS.map(async (slot): Promise<SlotAvailability> => {
        if (hasSlotStarted(date, slot)) {
          return { slot, available: false, remaining: 0 };
        }
        const taken = await bookingsRepository.countActiveForSlot(serviceId, date, slot);
        const remaining = Math.max(capacity - taken, 0);
        return { slot, available: remaining > 0, remaining };
      })
    );

    return { serviceId, date, slots };
  },

  async createBooking(customerId: string, input: CreateBookingInput, idempotencyKey: string | undefined) {
    if (!idempotencyKey || idempotencyKey.length > 200) {
      throw new AppError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'An Idempotency-Key header is required to create a booking');
    }
    const requestHash = createHash('sha256').update(stableStringify(input)).digest('hex');

    const replay = async () => {
      const existing = await bookingsRepository.findByCustomerAndIdempotencyKey(customerId, idempotencyKey);
      if (!existing) return null;
      if (existing.requestHash !== requestHash) {
        throw new AppError(409, 'IDEMPOTENCY_KEY_REUSED', 'This Idempotency-Key was already used with a different request');
      }
      return { booking: toView(existing as never), replayed: true };
    };

    const replayed = await replay();
    if (replayed) return replayed;

    const service = BOOKINGS_SERVICE_CATALOG.getById(input.serviceId);
    if (!service) throw new AppError(404, 'SERVICE_NOT_FOUND', 'That service was not found');

    const addOnLines: PriceLine[] = input.addOns.map((a) => {
      const addOn = service.addOns.find((x) => x.id === a.addOnId);
      if (!addOn) {
        throw new AppError(422, 'ADDON_NOT_FOUND', 'One of the selected add-ons is not available for this service', {
          addOnId: a.addOnId,
        });
      }
      return {
        kind: 'ADDON',
        refId: new Types.ObjectId(addOn.id),
        name: addOn.name,
        unitPrice: addOn.price,
        quantity: a.quantity,
        amount: addOn.price * a.quantity,
      };
    });

    if (new Set(input.addOns.map((a) => a.addOnId)).size !== input.addOns.length) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Each add-on can only be listed once');
    }

    assertBookableDate(input.date);
    if (hasSlotStarted(input.date, input.slot)) {
      throw new AppError(409, 'SLOT_UNAVAILABLE', 'That time slot has already started. Please pick another slot.');
    }

    let addressSnapshot: ResolvedAddress;
    if (input.addressId) {
      addressSnapshot = await addressesService.resolveForBooking(customerId, input.addressId);
    } else if (input.newAddress) {
      addressesService.assertServiceable(input.newAddress.pincode);
      addressSnapshot = { ...input.newAddress };
    } else {
      throw new AppError(400, 'VALIDATION_ERROR', 'Provide exactly one of addressId or newAddress');
    }

    if (input.couponCode) {
      throw new AppError(422, 'COUPON_INVALID', 'Coupons are not available yet. Remove the code to continue.');
    }

    const lines: PriceLine[] = [
      {
        kind: 'BASE',
        refId: new Types.ObjectId(service.id),
        name: service.name,
        unitPrice: service.basePrice,
        quantity: input.quantity,
        amount: service.basePrice * input.quantity,
      },
      ...addOnLines,
    ];
    const subtotal = lines.reduce((sum, l) => sum + l.amount, 0);
    const priceSnapshot: PriceSnapshot = {
      currency: 'INR',
      lines,
      subtotal,
      discount: 0,
      convenienceFee: CONVENIENCE_FEE,
      total: subtotal + CONVENIENCE_FEE,
      computedAt: new Date(),
    };

    if (input.expectedTotal !== undefined && Math.abs(input.expectedTotal - priceSnapshot.total) > PRICE_CHANGED_TOLERANCE) {
      throw new AppError(409, 'PRICE_CHANGED', `The price changed to ₹${priceSnapshot.total}. Please review and confirm again.`, {
        expectedTotal: input.expectedTotal,
        total: priceSnapshot.total,
      });
    }

    const requirePayment = await bookingSettings.isPaymentRequired();
    const capacity = await bookingSettings.getSlotCapacity(input.serviceId);
    const initialStatus = requirePayment ? BOOKING_STATUS.PENDING_PAYMENT : BOOKING_STATUS.CONFIRMED;
    const initialPaymentStatus = BOOKING_PAYMENT_STATUS.PENDING;
    const now = new Date();

    try {
      const created = await withSlotLock(`booking:${input.serviceId}:${input.date}:${input.slot}`, async () => {
        await bookingsRepository.releaseStaleHolds(input.serviceId, input.date, input.slot, now);
        const seat = await bookingsRepository.findFreeSeat(input.serviceId, input.date, input.slot, capacity);
        if (seat === null) {
          throw new AppError(409, 'SLOT_UNAVAILABLE', 'That slot has just been booked. Please pick another time.');
        }
        return bookingsRepository.create({
          customerId: new Types.ObjectId(customerId),
          serviceId: new Types.ObjectId(input.serviceId),
          quantity: input.quantity,
          addOns: input.addOns.map((a) => ({ addOnId: new Types.ObjectId(a.addOnId), quantity: a.quantity })),
          addressSnapshot: {
            ...addressSnapshot,
            sourceAddressId: addressSnapshot.sourceAddressId ? new Types.ObjectId(addressSnapshot.sourceAddressId) : undefined,
          },
          date: input.date,
          slot: input.slot,
          priceSnapshot,
          status: initialStatus,
          paymentStatus: initialPaymentStatus,
          history: [
            {
              from: null,
              to: initialStatus,
              at: now,
              actorId: new Types.ObjectId(customerId),
              actorRole: 'customer',
              note: requirePayment ? 'Booking created, awaiting payment' : 'Booking confirmed',
            },
          ],
          slotSeat: seat,
          idempotencyKey,
          requestHash,
          holdExpiresAt: requirePayment ? new Date(now.getTime() + BOOKING_HOLD_MS) : undefined,
        } as never);
      });
      return { booking: toView(created as never), replayed: false };
    } catch (err) {
      if (isDuplicateKey(err, 'uniq_customer_idem_key')) {
        const raced = await replay();
        if (raced) return raced;
      }
      if (isDuplicateKey(err, 'uniq_active_slot_seat')) {
        throw new AppError(409, 'SLOT_UNAVAILABLE', 'That slot has just been booked. Please pick another time.');
      }
      throw err;
    }
  },

  async getBooking(customerId: string, bookingId: string) {
    const booking = await bookingsRepository.findByIdForCustomer(bookingId, customerId);
    if (!booking) {
      throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    }
    return toView(booking as never);
  },

  async listBookings(customerId: string) {
    const bookings = await bookingsRepository.listForCustomer(customerId);
    return bookings.map((b) => toView(b as never));
  },
};