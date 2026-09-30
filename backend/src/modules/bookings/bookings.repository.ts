import { Types } from 'mongoose';
import { BookingModel, type IBooking } from '../../models/Booking';
import { SLOT_HOLDING_STATUSES } from './bookings.constants';

export class BookingsRepository {
  /** Active (slot-holding) bookings for a service/date/slot, used to compute remaining seats. */
  countActiveForSlot(serviceId: string, date: string, slot: string): Promise<number> {
    return BookingModel.countDocuments({
      serviceId: new Types.ObjectId(serviceId),
      date,
      slot,
      status: { $in: SLOT_HOLDING_STATUSES },
    }).exec();
  }

  findByCustomerAndIdempotencyKey(customerId: string, idempotencyKey: string): Promise<IBooking | null> {
    return BookingModel.findOne({ customerId: new Types.ObjectId(customerId), idempotencyKey }).exec();
  }

  /** Next free seat number (1..capacity) for (service, date, slot), or null if full. Caller must
   *  hold the Redis lock (or accept the unique-index race, which this call ultimately relies on). */
  async findFreeSeat(serviceId: string, date: string, slot: string, capacity: number): Promise<number | null> {
    const taken = await BookingModel.find({
      serviceId: new Types.ObjectId(serviceId),
      date,
      slot,
      status: { $in: SLOT_HOLDING_STATUSES },
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
    return BookingModel.findById(id).exec();
  }

  findByIdForCustomer(id: string, customerId: string): Promise<IBooking | null> {
    if (!Types.ObjectId.isValid(id)) return Promise.resolve(null);
    return BookingModel.findOne({ _id: id, customerId: new Types.ObjectId(customerId) }).exec();
  }
}

export const bookingsRepository = new BookingsRepository();
