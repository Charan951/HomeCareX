import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().min(20, 'Review must be at least 20 characters').max(2000, 'Review must be 2000 characters or fewer'),
});

export const reviewStatusSchema = z.enum(['pending', 'approved', 'rejected']);

export const adminReviewQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  status: reviewStatusSchema.optional(),
});

export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
