import { z } from 'zod';

const pincode = z.string().trim().regex(/^\d{4,10}$/, 'Invalid pincode');

export const createAddressBodySchema = z.object({
  label: z.string().trim().min(1).max(50).optional(),
  contactName: z.string().trim().max(100).optional(),
  contactPhone: z.string().trim().max(20).optional(),
  line1: z.string().trim().min(1, 'Address line is required').max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode,
  location: z.object({ lat: z.number().gte(-90).lte(90), lng: z.number().gte(-180).lte(180) }).optional(),
  isDefault: z.boolean().optional(),
});

export const serviceabilityQuerySchema = z.object({ pincode });

export const addressParamsSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id') });
