import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be 60 characters or fewer'),
  description: z.string().trim().max(240).optional(),
  icon: z.string().trim().max(8).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().optional(),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: 'Nothing to update',
});

export const categoriesValidation = { categoryCreateSchema, categoryUpdateSchema };
