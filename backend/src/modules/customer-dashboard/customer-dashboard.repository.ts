import { Types, type PipelineStage } from 'mongoose';
import BookingModel from '../../models/Booking';
import CategoryModel from '../../models/Category';
import NotificationModel from '../../models/Notification';
import PartnerModel from '../../models/Partner';
import ServiceModel from '../../models/Service';
import UserModel from '../../models/User';
import type { BookingStatus } from '../bookings/bookings.constants';
import {
  DASHBOARD_LIVE_STATUSES,
  DASHBOARD_UPCOMING_STATUSES,
  MAX_BOOKINGS_PER_SECTION,
  MAX_CATEGORIES,
  MAX_RECOMMENDED_SERVICES,
} from './customer-dashboard.constants';
import type { BookingsFacet, CategoryRow, ServiceRow } from './customer-dashboard.types';

/**
 * SECURITY: every query below is scoped to `customerId` / `userId` that the service
 * took from the verified token. Aggregations do NOT honour `select: false`, so each
 * pipeline ends in a $project WHITELIST (never returns otpCodes, offers, statusHistory,
 * partnerEarning, other users' data, etc.).
 */

export interface CollectionNames {
  partners: string;
  users: string;
  services: string;
}

const defaultCollections = (): CollectionNames => ({
  partners: PartnerModel.collection.name,
  users: UserModel.collection.name,
  services: ServiceModel.collection.name,
});

/** One section of the bookings facet: filter by status, sort, limit, then add the partner's name. */
function bookingSection(
  statuses: BookingStatus[],
  sort: Record<string, 1 | -1>,
  c: CollectionNames,
): PipelineStage.FacetPipelineStage[] {
  return [
    { $match: { status: { $in: statuses } } },
    { $sort: sort },
    { $limit: MAX_BOOKINGS_PER_SECTION },
    { $lookup: { from: c.partners, localField: 'partnerId', foreignField: '_id', as: 'partner' } },
    { $unwind: { path: '$partner', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: c.users, localField: 'partner.userId', foreignField: '_id', as: 'partnerUser' } },
    { $unwind: { path: '$partnerUser', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 1,
        serviceName: 1,
        status: 1,
        scheduledAt: 1,
        'address.line1': 1,
        'address.area': 1,
        'address.city': 1,
        'priceBreakdown.total': 1,
        partnerName: '$partnerUser.name',
      },
    },
  ];
}

/** Active + upcoming + lifetime count for ONE customer, in a single round trip. */
export function buildBookingsPipeline(customerId: Types.ObjectId, c: CollectionNames = defaultCollections()): PipelineStage[] {
  return [
    { $match: { customerId } }, // first stage: uses the customerId index, isolates the customer
    {
      $facet: {
        active: bookingSection(DASHBOARD_LIVE_STATUSES, { updatedAt: -1 }, c),
        upcoming: bookingSection(DASHBOARD_UPCOMING_STATUSES, { scheduledAt: 1 }, c),
        total: [{ $count: 'n' }],
      },
    },
    {
      $project: {
        active: 1,
        upcoming: 1,
        total: { $ifNull: [{ $arrayElemAt: ['$total.n', 0] }, 0] },
      },
    },
  ];
}

export function buildCategoriesPipeline(c: CollectionNames = defaultCollections()): PipelineStage[] {
  return [
    { $match: { active: { $ne: false } } },
    { $sort: { sortOrder: 1, name: 1 } },
    { $limit: MAX_CATEGORIES },
    {
      $lookup: {
        from: c.services,
        let: { cid: '$_id' },
        pipeline: [{ $match: { $expr: { $eq: ['$categoryId', '$$cid'] }, active: { $ne: false } } }, { $count: 'n' }],
        as: 'svc',
      },
    },
    {
      $project: {
        name: 1,
        slug: 1,
        icon: 1,
        serviceCount: { $ifNull: [{ $arrayElemAt: ['$svc.n', 0] }, 0] },
      },
    },
  ];
}

export function buildRecommendedPipeline(): PipelineStage[] {
  return [
    { $match: { active: { $ne: false } } },
    { $sort: { bookingsCount: -1, ratingAvg: -1, _id: 1 } },
    { $limit: MAX_RECOMMENDED_SERVICES },
    {
      $project: {
        name: 1,
        slug: 1,
        categoryId: 1,
        icon: 1,
        basePrice: 1,
        durationMinutes: 1,
        ratingAvg: 1,
        ratingCount: 1,
      },
    },
  ];
}

export const customerDashboardRepository = {
  findCustomerName(userId: Types.ObjectId) {
    return UserModel.findById(userId).select('name').lean<{ name: string } | null>().exec();
  },

  async bookings(customerId: Types.ObjectId): Promise<BookingsFacet> {
    const [row] = await BookingModel.aggregate<BookingsFacet>(buildBookingsPipeline(customerId));
    return row ?? { active: [], upcoming: [], total: 0 };
  },


  categories() {
    return CategoryModel.aggregate<CategoryRow>(buildCategoriesPipeline()).exec();
  },

  recommendedServices() {
    return ServiceModel.aggregate<ServiceRow>(buildRecommendedPipeline()).exec();
  },

  unreadNotifications(userId: Types.ObjectId) {
    return NotificationModel.countDocuments({ userId, readAt: null }).exec();
  },
};
