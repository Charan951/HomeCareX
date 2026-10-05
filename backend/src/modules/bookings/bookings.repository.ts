import { Types } from 'mongoose';
import { BookingModel, type IBooking } from '../../models/Booking';
import { BOOKING_STATUS, SLOT_HOLDING_STATUSES } from './bookings.constants';

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
      .populate('partnerId', 'name rating phone avatar')
      .exec();
  }

  /** Return all bookings for a customer sorted by creation time with partner details populated */
  listForCustomer(customerId: string): Promise<IBooking[]> {
    if (!Types.ObjectId.isValid(customerId)) return Promise.resolve([]);

    return BookingModel.find({ customerId: new Types.ObjectId(customerId) })
      .populate('partnerId', 'name rating phone avatar')
      .sort({ createdAt: -1 })
      .exec();
  }
}

export const bookingsRepository = new BookingsRepository();