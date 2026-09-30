
import { Types } from 'mongoose';
import BookingModel from '../../models/Booking';
import PartnerModel from '../../models/Partner';
import { ACTIVE_JOB_STATUSES, COMPLETED_STATUSES, SCHEDULED_JOB_STATUSES } from '../bookings/bookings.constants';

export interface ActiveJobDoc {
  _id: Types.ObjectId;
  serviceName: string;
  customerName: string;
  address: { line1: string; area?: string | null; city: string };
  status: 'en_route' | 'arrived' | 'in_progress';
  scheduledAt: Date;
}

export const partnerDashboardRepository = {
  findPartnerByUserId(userId: string) {
    return PartnerModel.findOne({ userId }).select('ratingAvg stats').lean();
  },

  /** Offers still open for this partner. */
  countOpenOffers(partnerId: Types.ObjectId, now: Date) {
    return BookingModel.countDocuments({
      status: 'searching_for_partner',
      offers: { $elemMatch: { partnerId, response: 'pending', expiresAt: { $gt: now } } },
    });
  },

  countScheduled(partnerId: Types.ObjectId, start: Date, end: Date) {
    return BookingModel.countDocuments({
      partnerId,
      status: { $in: SCHEDULED_JOB_STATUSES },
      scheduledAt: { $gte: start, $lt: end },
    });
  },

  async completedToday(partnerId: Types.ObjectId, start: Date, end: Date) {
    const [row] = await BookingModel.aggregate<{ count: number; earnings: number }>([
      { $match: { partnerId, status: { $in: COMPLETED_STATUSES }, completedAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, count: { $sum: 1 }, earnings: { $sum: '$partnerEarning' } } },
    ]);
    return { count: row?.count ?? 0, earnings: row?.earnings ?? 0 };
  },

  findActiveJob(partnerId: Types.ObjectId) {
    return BookingModel.findOne({ partnerId, status: { $in: ACTIVE_JOB_STATUSES } })
      .sort({ updatedAt: -1 })
      .select('serviceName customerName address status scheduledAt')
      .lean<ActiveJobDoc>();
  },
};