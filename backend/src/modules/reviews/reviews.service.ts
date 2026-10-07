import { Types } from 'mongoose';
import { ERROR_CODES } from '../../constants/errorCodes';
import { ReviewModel } from '../../models/Review';
import { UserModel } from '../../models/User';
import { HttpError } from '../auth/auth.types';
import { COMPLETED_STATUSES, type BookingStatus } from '../bookings/bookings.constants';
import { STAR_VALUES } from './reviews.constants';
import { reviewsRepository, type VisibleReviewRow } from './reviews.repository';
import type { PublicReviewDto, ReviewSummaryDto, ServiceReviewsResult, StarDistribution } from './reviews.types';
import {
  adminReviewQuerySchema,
  createReviewSchema,
  reviewStatusSchema,
  serviceReviewsParamSchema,
  serviceReviewsQuerySchema,
  type ReviewStatus,
} from './reviews.validation';

/** "Ravi Kumar" -> "Ravi K."; a single name stays as is. The customer's email never leaves the server. */
export function maskAuthor(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Customer';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

const toPublicReview = (r: VisibleReviewRow): PublicReviewDto => ({
  id: String(r._id),
  rating: r.rating,
  comment: r.message,
  author: maskAuthor(r.customerName),
  verified: r.verified === true,
  createdAt: new Date(r.createdAt).toISOString(),
});

/** Zero-filled distribution plus the count and one-decimal average derived from it. */
export function buildSummary(counts: Map<number, number>): ReviewSummaryDto {
  const distribution: StarDistribution = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
  let count = 0;
  let sum = 0;
  for (const star of STAR_VALUES) {
    const n = counts.get(star) ?? 0;
    distribution[String(star) as keyof StarDistribution] = n;
    count += n;
    sum += n * star;
  }
  return { average: count === 0 ? 0 : Math.round((sum / count) * 10) / 10, count, distribution };
}

const isDuplicateKey = (err: unknown): boolean => (err as { code?: number })?.code === 11000;

export class ReviewsService {
  async createReview(customerId: string, input: unknown) {
    const parsed = createReviewSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid review', 'VALIDATION_ERROR');
    }
    if (!Types.ObjectId.isValid(customerId)) throw new HttpError(401, 'Authentication required', 'NO_ACCESS_TOKEN');
    const customer = await UserModel.findById(customerId).select('name email').lean();
    if (!customer) throw new HttpError(404, 'Customer not found', 'NOT_FOUND');

    const link = await this.resolveServiceLink(customerId, parsed.data.serviceId, parsed.data.bookingId);

    try {
      const review = await ReviewModel.create({
        customerId: customer._id,
        customerName: customer.name,
        customerEmail: customer.email,
        rating: parsed.data.rating,
        message: parsed.data.message,
        ...link,
      });
      return review.toObject();
    } catch (err) {
      if (isDuplicateKey(err)) throw new HttpError(409, 'You have already reviewed this booking', ERROR_CODES.CONFLICT);
      throw err;
    }
  }

  /**
   * Decides what a service review links to. `verified` is true only when a booking is given and it is
   * this customer's, for this service, and finished. Without a serviceId the review stays a site-wide testimonial.
   */
  private async resolveServiceLink(customerId: string, serviceId?: string, bookingId?: string) {
    if (!serviceId) return {};
    if (!bookingId) return { serviceId: new Types.ObjectId(serviceId), verified: false };
    const booking = await reviewsRepository.findBookingForReview(bookingId);
    // Same 404 for "no such booking" and "someone else's booking" so ids can't be probed.
    if (!booking || String(booking.customerId) !== customerId) throw new HttpError(404, 'Booking not found', ERROR_CODES.BOOKING_NOT_FOUND);
    if (!booking.serviceId || String(booking.serviceId) !== serviceId) throw new HttpError(400, 'This booking is not for that service', ERROR_CODES.VALIDATION_ERROR);
    if (!COMPLETED_STATUSES.includes(booking.status as BookingStatus)) {
      throw new HttpError(409, 'You can review a service once the booking is completed', ERROR_CODES.CONFLICT);
    }
    return { serviceId: new Types.ObjectId(serviceId), bookingId: new Types.ObjectId(bookingId), verified: true };
  }

  /** Public. Approved reviews of one active service, newest first, with the star distribution of the same set. */
  async listServiceReviews(params: unknown, query: unknown): Promise<ServiceReviewsResult> {
    const { id } = serviceReviewsParamSchema.parse(params);
    const { page, limit } = serviceReviewsQuerySchema.parse(query);
    if (!(await reviewsRepository.isServiceVisible(id))) throw new HttpError(404, 'Service not found', ERROR_CODES.NOT_FOUND);

    const [counts, rows] = await Promise.all([reviewsRepository.starCounts(id), reviewsRepository.findVisible(id, (page - 1) * limit, limit)]);
    const summary = buildSummary(counts);
    return {
      summary,
      reviews: rows.map(toPublicReview),
      meta: { page, limit, total: summary.count, totalPages: Math.ceil(summary.count / limit) },
    };
  }

  async listCustomerReviews(customerId: string) {
    if (!Types.ObjectId.isValid(customerId)) throw new HttpError(401, 'Authentication required', 'NO_ACCESS_TOKEN');
    return ReviewModel.find({ customerId }).sort({ createdAt: -1 }).lean();
  }

  async listAdminReviews(query: unknown) {
    const parsed = adminReviewQuerySchema.safeParse(query);
    if (!parsed.success) throw new HttpError(400, 'Invalid review filters', 'VALIDATION_ERROR');
    const { page, limit, search, status } = parsed.data;
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      const expression = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ customerName: expression }, { customerEmail: expression }, { message: expression }];
    }
    const [reviews, total, pending, approved, rejected, allReviews] = await Promise.all([
      ReviewModel.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      ReviewModel.countDocuments(filter),
      ReviewModel.countDocuments({ status: 'pending' }),
      ReviewModel.countDocuments({ status: 'approved' }),
      ReviewModel.countDocuments({ status: 'rejected' }),
      ReviewModel.countDocuments(),
    ]);
    return {
      reviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats: { total: allReviews, pending, approved, rejected },
    };
  }

  async updateReviewStatus(id: string, status: unknown) {
    if (!Types.ObjectId.isValid(id)) throw new HttpError(400, 'Invalid review ID', 'INVALID_ID');
    const parsedStatus = reviewStatusSchema.safeParse(status);
    if (!parsedStatus.success) throw new HttpError(400, 'Invalid review status', 'VALIDATION_ERROR');
    const review = await ReviewModel.findByIdAndUpdate(
      id,
      { $set: { status: parsedStatus.data as ReviewStatus } },
      { new: true, runValidators: true },
    ).lean();
    if (!review) throw new HttpError(404, 'Review not found', 'NOT_FOUND');
    return review;
  }
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
