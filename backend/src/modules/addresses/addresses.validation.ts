import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid address id');

/** Empty / whitespace-only optional text becomes null so it clears the field. */
const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .transform((v) => (v === '' ? null : v))
    .optional();

const pincode = z
  .union([z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'), z.literal(''), z.null()])
  .transform((v) => (v === '' ? null : v))
  .optional();

export const createAddressBodySchema = z
  .object({
    label: z.string().trim().min(1, 'Label is required').max(30),
    line1: z.string().trim().min(1, 'Address line is required').max(200),
    area: optionalText(100),
    city: z.string().trim().min(1, 'City is required').max(100),
    pincode,
    isDefault: z.boolean().optional(),
  })
  .strict();

export const updateAddressBodySchema = z
  .object({
    label: z.string().trim().min(1).max(30).optional(),
    line1: z.string().trim().min(1).max(200).optional(),
    area: optionalText(100),
    city: z.string().trim().min(1).max(100).optional(),
    pincode,
    /** Only `true`: to move the default, pick another address. */
    isDefault: z.literal(true).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: 'Send at least one field to update' });

export const addressIdParamsSchema = z.object({ id: objectId }).strict();
