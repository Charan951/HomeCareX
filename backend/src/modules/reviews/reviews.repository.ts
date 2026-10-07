import { Types } from 'mongoose';
import { BookingModel } from '../../models/Booking';
import { CategoryModel } from '../../models/Category';
import { ReviewModel } from '../../models/Review';
import { ServiceModel } from '../../models/Service';

export interface VisibleReviewRow {
  _id: Types.ObjectId;
  rating: number;
  message: string;
  customerName: string;
  verified?: boolean;
  createdAt: Date;
}

export interface BookingForReview {
  customerId: Types.ObjectId;
  serviceId?: Types.ObjectId;
  status: string;
}

const VISIBLE_FIELDS = 'rating message customerName verified createdAt';

/** Visible = approved and linked to this service. Pure, so tests run the exact same filter in memory. */
export const visibleReviewFilter = (serviceId: string) => ({ serviceId: new Types.ObjectId(serviceId), status: 'approved' });

/** Newest first; `_id` breaks ties so pages never overlap or skip. */
export const VISIBLE_REVIEW_SORT = { createdAt: -1, _id: -1 } as const;

/** Star -> count over the visible set. */
export const starCountPipeline = (serviceId: string) => [
  { $match: visibleReviewFilter(serviceId) },
  { $group: { _id: '$rating', count: { $sum: 1 } } },
];

/** Only layer that talks to Mongo for reviews. Tests swap these methods for in-memory versions. */
export class ReviewsRepository {
  /** True for an active service in an active category (the same rule GET /services/:slug uses for 404). */
  async isServiceVisible(serviceId: string): Promise<boolean> {
    const service = await ServiceModel.findOne({ _id: serviceId, active: { $ne: false } }, 'categoryId').lean<{ categoryId: Types.ObjectId }>().exec();
    if (!service) return false;
    return (await CategoryModel.exists({ _id: service.categoryId, active: { $ne: false } })) !== null;
  }

  findVisible(serviceId: string, skip: number, limit: number): Promise<VisibleReviewRow[]> {
    return ReviewModel.find(visibleReviewFilter(serviceId), VISIBLE_FIELDS)
      .sort(VISIBLE_REVIEW_SORT)
      .skip(skip)
      .limit(limit)
      .lean<VisibleReviewRow[]>()
      .exec();
  }

  /** Star -> count over the same visible set (one grouped query, no per-star round trips). */
  async starCounts(serviceId: string): Promise<Map<number, number>> {
    const rows = await ReviewModel.aggregate<{ _id: number; count: number }>(starCountPipeline(serviceId));
    return new Map(rows.map((r) => [r._id, r.count]));
  }

  findBookingForReview(bookingId: string): Promise<BookingForReview | null> {
    return BookingModel.findById(bookingId, 'customerId serviceId status').lean<BookingForReview>().exec();
  }
}

export const reviewsRepository = new ReviewsRepository();
