import { z } from 'zod';
import { ADDRESS_LABELS } from '../../models/Address';

const pincode = z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits');

const addressFields = z.object({
  label: z.enum(ADDRESS_LABELS, { errorMap: () => ({ message: 'Label must be Home, Work or Other' }) }).optional(),
  contactName: z.string().trim().max(100).optional(),
  contactPhone: z.string().trim().max(20).optional(),
  house: z.string().trim().min(1, 'House is required').max(100).optional(),
  street: z.string().trim().min(1, 'Street is required').max(150).optional(),
  area: z.string().trim().max(150).optional(),
  line1: z.string().trim().min(1, 'Address line is required').max(260).optional(),
  line2: z.string().trim().max(150).optional(),
  landmark: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode,
  location: z.object({ lat: z.number().gte(-90).lte(90), lng: z.number().gte(-180).lte(180) }).optional(),
  isDefault: z.boolean().optional(),
});

export const createAddressBodySchema = addressFields.refine((v) => Boolean(v.line1) || (Boolean(v.house) && Boolean(v.street)), {
  message: 'House and street are required',
  path: ['house'],
});

export const updateAddressBodySchema = addressFields
  .partial()
  .refine((v) => Object.values(v).some((x) => x !== undefined), { message: 'Send at least one field to update' });

export const serviceabilityQuerySchema = z.object({ pincode });

export const addressParamsSchema = z.object({ id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id') });
