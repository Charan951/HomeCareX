import { z } from 'zod';
import { Types } from 'mongoose';

const objectId = z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id');

const addOnSchema = z.object({
  id: objectId.optional(), // send back the existing id to keep an add-on's identity
  name: z.string().trim().min(2).max(60),
  price: z.number().min(0).max(1_000_000),
});

export const serviceCreateSchema = z.object({
  categoryId: objectId,
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  description: z.string().trim().max(1000).optional(),
  basePrice: z.number().min(0).max(1_000_000),
  durationMinutes: z.number().int().min(5).max(1440).optional(),
  addOns: z.array(addOnSchema).max(20).optional(),
  active: z.boolean().optional(),
});

export const serviceUpdateSchema = serviceCreateSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: 'Nothing to update',
});

export const serviceQuerySchema = z.object({
  category: z.string().trim().optional(), // category id or slug
  q: z.string().trim().max(60).optional(),
  active: z.enum(['true', 'false']).optional(), // admin list only
});
