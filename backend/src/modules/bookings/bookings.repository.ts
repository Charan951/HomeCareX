import { randomInt } from 'crypto';
import { Types } from 'mongoose';
import { BookingModel, type IBooking } from '../../models/Booking';
import { BOOKING_STATUS, EXTRA_CHARGE_DECISION_STATUSES, SLOT_HOLDING_STATUSES } from './bookings.constants';
import { buildBookingFilter, SORT_SPECS, type ListBookingsQuery } from './bookings.query';

export class BookingsRepository {
  /** Active (slot-holding) bookings for a service/date/slot, used to compute remaining seats. */
  countActiveForSlot(serviceId: string, date: string, slot: string, now: Date = new Date()): Promise<number> {
    if (!Types.ObjectId.isValid(serviceId)) return Promise.resolve(0);

    return BookingModel.countDocuments({
      serviceId: new Types.ObjectId(serviceId),
      date,
      slot,
      status: { $in: SLOT_HOLDING_STATUSES },
      $nor: [{ status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $lte: now } }],
    }).exec();
  }

  /** Cancels lapsed pending_payment holds for one slot so their seats are freed. */
  releaseStaleHolds(serviceId: string, date: string, slot: string, now: Date = new Date()): Promise<unknown> {
    if (!Types.ObjectId.isValid(serviceId)) return Promise.resolve(null);

    return BookingModel.updateMany(
      {
        serviceId: new Types.ObjectId(serviceId),
        date,
        slot,
        status: BOOKING_STATUS.PENDING_PAYMENT,
        holdExpiresAt: { $lte: now },
      },
      {
        $set: { status: BOOKING_STATUS.CANCELLED_BY_CUSTOMER },
        // Free the seat so the unique (service, date, slot, seat) index lets someone else take it.
        $unset: { slotSeat: '' },
        $push: {
          statusHistory: {
            from: BOOKING_STATUS.PENDING_PAYMENT,
            to: BOOKING_STATUS.CANCELLED_BY_CUSTOMER,
            at: now,
            actorRole: 'system',
            reason: 'Payment hold expired',
          },
        },
      }
    ).exec();
  }

  findByCustomerAndIdempotencyKey(customerId: string, idempotencyKey: string): Promise<IBooking | null> {
    if (!Types.ObjectId.isValid(customerId)) return Promise.resolve(null);

    return BookingModel.findOne({
      customerId: new Types.ObjectId(customerId),
      idempotencyKey,
    }).exec();
  }

  async findFreeSeat(
    serviceId: string,
    date: string,
    slot: string,
    capacity: number,
    now: Date = new Date()
  ): Promise<number | null> {
    if (!Types.ObjectId.isValid(serviceId)) return null;

    const taken = await BookingModel.find({
      serviceId: new Types.ObjectId(serviceId),
      date,
      slot,
      status: { $in: SLOT_HOLDING_STATUSES },
      $nor: [{ status: BOOKING_STATUS.PENDING_PAYMENT, holdExpiresAt: { $lte: now } }],
    })
      .select('slotSeat')
      .lean()
      .exec();

    const takenSeats = new Set(taken.map((b) => b.slotSeat));
    for (let seat = 1; seat <= capacity; seat += 1) {
      if (!takenSeats.has(seat)) return seat;
    }
    return null;
  }

  create(doc: Partial<IBooking>): Promise<IBooking> {
    return BookingModel.create(doc);
  }

  findById(id: string): Promise<IBooking | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);

    return BookingModel.findById(id)
      .populate('partnerId', 'name rating phone avatar')
      .exec();
  }

  findByIdForCustomer(id: string, customerId: string): Promise<IBooking | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(customerId)) {
      return Promise.resolve(null);
    }

    return BookingModel.findOne({
      _id: new Types.ObjectId(id),
      customerId: new Types.ObjectId(customerId),
    })
      // Name and phone live on the partner's User; rating lives on the Partner profile.
      .populate({
        path: 'partnerId',
        select: 'userId city ratingAvg ratingCount kyc.status',
        populate: { path: 'userId', select: 'name phone' },
      })
      .exec();
  }

  /**
   * The start OTP for a booking whose partner has arrived. Created on first read (4 digits) and then
   * stable, so the code the customer sees is the code the partner must enter. Safe under concurrent
   * reads: only one writer wins the conditional update, the other re-reads the winner's code.
   */
  async getOrCreateStartOtp(id: string): Promise<string | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const _id = new Types.ObjectId(id);
    type WithOtp = { otpCodes?: { start?: string } } | null;

    const existing = (await BookingModel.findById(_id).select('+otpCodes.start').lean().exec()) as WithOtp;
    if (existing?.otpCodes?.start) return existing.otpCodes.start;

    const code = String(randomInt(0, 10_000)).padStart(4, '0');
    const updated = (await BookingModel.findOneAndUpdate(
      {
        _id,
        status: BOOKING_STATUS.ARRIVED,
        $or: [{ 'otpCodes.start': { $exists: false } }, { 'otpCodes.start': null }, { 'otpCodes.start': '' }],
      },
      { $set: { 'otpCodes.start': code } },
      { new: true },
    )
      .select('+otpCodes.start')
      .lean()
      .exec()) as WithOtp;
    if (updated?.otpCodes?.start) return updated.otpCodes.start;

    const winner = (await BookingModel.findById(_id).select('+otpCodes.start').lean().exec()) as WithOtp;
    return winner?.otpCodes?.start ?? null;
  }

  /**
   * Records the customer's decision on ONE pending extra charge, atomically.
   * The filter is the whole rule: own booking, partner on site, charge still pending. Returns null when
   * any of those is false, so a double tap or a stale screen can never decide a charge twice.
   */
  decideExtraCharge(
    bookingId: string,
    customerId: string,
    chargeId: string,
    decision: 'approved' | 'rejected',
    now: Date = new Date(),
  ): Promise<IBooking | null> {
    if (![bookingId, customerId, chargeId].every((v) => Types.ObjectId.isValid(v))) return Promise.resolve(null);
    const charge = new Types.ObjectId(chargeId);

    return BookingModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(bookingId),
        customerId: new Types.ObjectId(customerId),
        status: { $in: EXTRA_CHARGE_DECISION_STATUSES },
        extraCharges: { $elemMatch: { _id: charge, status: 'pending' } },
      },
      { $set: { 'extraCharges.$[c].status': decision, 'extraCharges.$[c].decidedAt': now } },
      { new: true, arrayFilters: [{ 'c._id': charge, 'c.status': 'pending' }] },
    ).exec();
  }

  /** Return all bookings for a customer sorted by creation time with partner details populated */
  listForCustomer(customerId: string): Promise<IBooking[]> {
    if (!Types.ObjectId.isValid(customerId)) return Promise.resolve([]);

    return BookingModel.find({ customerId: new Types.ObjectId(customerId) })
      .populate('partnerId', 'name rating phone avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** One page of a customer's bookings, with the filters, sort and total the list screen needs. */
  async listPageForCustomer(
    customerId: string,
    query: ListBookingsQuery,
    now: Date = new Date()
  ): Promise<{ items: IBooking[]; total: number }> {
    if (!Types.ObjectId.isValid(customerId)) return { items: [], total: 0 };

    const filter = buildBookingFilter(customerId, query, now);
    const [items, total] = await Promise.all([
      BookingModel.find(filter)
        .populate('partnerId', 'name rating phone avatar')
        .sort(SORT_SPECS[query.sort])
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      BookingModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}

export const bookingsRepository = new BookingsRepository();