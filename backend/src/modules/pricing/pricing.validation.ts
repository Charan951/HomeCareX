import { z } from 'zod';
import { SERVICE_SLOTS } from '../bookings/bookings.constants';

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

export const quoteBodySchema = z.object({
  serviceId: objectIdString,
  quantity: z.number().int().min(1).max(20),
  addOns: z
    .array(z.object({ addOnId: objectIdString, quantity: z.number().int().min(1).max(20) }))
    .max(20)
    .default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  slot: z.enum(SERVICE_SLOTS, { message: 'Unrecognized slot' }),
  couponCode: z.string().trim().min(1).max(30).optional(),
});

export const pricingValidation = { quoteBodySchema };