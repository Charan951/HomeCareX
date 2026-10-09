import type { Types } from 'mongoose';
import BookingModel, { type IBooking } from '../../models/Booking';
import PartnerModel from '../../models/Partner';
import ServiceModel from '../../models/Service';
import UserModel from '../../models/User';
import type { BookingStatus } from '../bookings/bookings.constants';
import type { StatusHistoryEntry } from '../bookings/bookings.stateMachine';

export interface JobBookingDoc {
  _id: Types.ObjectId;
  customerId: Types.ObjectId;
  partnerId?: Types.ObjectId | null;
  serviceId?: Types.ObjectId;
  serviceName: string;
  customerName?: string;
  quantity: number;
  addOns: Array<{ addOnId: Types.ObjectId; quantity: number }>;
  address: {
    line1: string;
    area?: string | null;
    city: string;
    pincode?: string | null;
    location?: { coordinates?: number[] };
  };
  date?: string;
  slot?: string;
  scheduledAt: Date;
  startedAt?: Date;
  status: BookingStatus;
  statusHistory: IBooking['statusHistory'];
  priceSnapshot?: { currency?: string; lines?: Array<{ kind: string; name: string; quantity: number; amount: number }> };
  priceBreakdown?: { total?: number };
  partnerEarning?: number;
  paymentStatus: string;
  paymentDetails?: { paidAt?: Date };
  instructions?: string;
  checklist?: Array<{ id: string; label: string; done: boolean }>;
}

export interface JobServiceDoc {
  durationMinutes?: number;
  inclusions?: string[];
  addOns?: Array<{ _id: Types.ObjectId; name: string; price: number }>;
}

export interface JobCustomerDoc {
  name?: string;
  phone?: string;
}

export const partnerJobsRepository = {
  findPartnerByUserId(userId: string) {
    return PartnerModel.findOne({ userId }).select('_id').lean<{ _id: Types.ObjectId }>();
  },

  findBooking(bookingId: string) {
    return BookingModel.findById(bookingId).lean<JobBookingDoc>();
  },

  findCustomer(customerId: Types.ObjectId) {
    return UserModel.findById(customerId).select('name phone').lean<JobCustomerDoc>();
  },

  findService(serviceId: Types.ObjectId) {
    return ServiceModel.findById(serviceId).select('durationMinutes inclusions addOns').lean<JobServiceDoc>();
  },

  /**
   * Atomic compare-and-set: only succeeds while the booking is still in `from` and still belongs to this
   * partner, so a double click or two devices can never apply the same step twice.
   */
  async transitionStatus(
    bookingId: string,
    partnerId: Types.ObjectId,
    from: BookingStatus,
    to: BookingStatus,
    entry: StatusHistoryEntry,
  ): Promise<boolean> {
    const result = await BookingModel.updateOne(
      { _id: bookingId, partnerId, status: from },
      { $set: { status: to }, $push: { statusHistory: entry } },
    );
    return result.modifiedCount === 1;
  },
};