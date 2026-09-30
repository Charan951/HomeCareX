import { Types } from 'mongoose';
import { ReviewModel } from '../../models/Review';
import { UserModel } from '../../models/User';
import { HttpError } from '../auth/auth.types';
import {
  adminReviewQuerySchema,
  createReviewSchema,
  reviewStatusSchema,
  type ReviewStatus,
} from './reviews.validation';

export class ReviewsService {
  async createReview(customerId: string, input: unknown) {
    const parsed = createReviewSchema.safeParse(input);
    if (!parsed.success) {
      throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid review', 'VALIDATION_ERROR');
    }
    if (!Types.ObjectId.isValid(customerId)) throw new HttpError(401, 'Authentication required', 'NO_ACCESS_TOKEN');
    const customer = await UserModel.findById(customerId).select('name email').lean();
    if (!customer) throw new HttpError(404, 'Customer not found', 'NOT_FOUND');

    const review = await ReviewModel.create({
      customerId: customer._id,
      customerName: customer.name,
      customerEmail: customer.email,
      rating: parsed.data.rating,
      message: parsed.data.message,
    });
    return review.toObject();
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
