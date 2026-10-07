import { Types } from 'mongoose';
import { z } from 'zod';
import { REVIEW_LIMIT_DEFAULT, REVIEW_LIMIT_MAX, REVIEW_PAGE_DEFAULT, REVIEW_PAGE_MAX } from './reviews.constants';

/** "?page=" (empty) is treated as "not sent" so a cleared control never errors. */
const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const objectId = (label: string) =>
  z.string({ required_error: `${label} is required` }).trim().refine((v) => /^[0-9a-fA-F]{24}$/.test(v) && Types.ObjectId.isValid(v), `${label} must be a valid id`);

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().min(20, 'Review must be at least 20 characters').max(2000, 'Review must be 2000 characters or fewer'),
  /** Optional link to a service. `verified` is never accepted from the client: the server derives it from the booking. */
  serviceId: objectId('serviceId').optional(),
  bookingId: objectId('bookingId').optional(),
}).refine((v) => !v.bookingId || Boolean(v.serviceId), { path: ['serviceId'], message: 'serviceId is required when bookingId is given' });

export const reviewStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const adminReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: reviewStatusSchema.optional(),
});

export const serviceReviewsParamSchema = z.object({ id: objectId('Service id') });

/** Public list query. `.strict()` makes any stray param a 400. */
export const serviceReviewsQuerySchema = z
  .object({
    page: z.preprocess(blankToUndefined, z.coerce.number().int('page must be a whole number').min(1, 'page must be at least 1').max(REVIEW_PAGE_MAX, `page must be at most ${REVIEW_PAGE_MAX}`).default(REVIEW_PAGE_DEFAULT)),
    limit: z.preprocess(blankToUndefined, z.coerce.number().int('limit must be a whole number').min(1, 'limit must be at least 1').max(REVIEW_LIMIT_MAX, `limit must be at most ${REVIEW_LIMIT_MAX}`).default(REVIEW_LIMIT_DEFAULT)),
  })
  .strict();

export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
