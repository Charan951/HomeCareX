import { z } from 'zod';
import { PRICING_MODES } from '../../models/PricingRule';
import { SERVICE_SLOTS } from '../bookings/bookings.constants';

const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');
const rupees = (label: string) =>
  z.number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`)
    .max(1_000_000, `${label} is too large`);
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:mm');
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));

export const surgeWindowSchema = z
  .object({
    label: z.string().trim().min(1, 'Surge label is required').max(40),
    startTime: time,
    endTime: time,
    percent: z.number({ required_error: 'Surge percent is required' }).min(0, 'Surge percent cannot be negative').max(200, 'Surge percent is too high'),
  })
  .refine((w) => toMin(w.startTime) < toMin(w.endTime), { message: 'Surge end must be after start', path: ['endTime'] });

/** PUT /admin/pricing body. serviceId omitted/null = the rule applies to the whole category. */
export const putPricingBodySchema = z
  .object({
    categoryId: objectIdString,
    serviceId: objectIdString.nullish(),
    city: z.string().trim().max(100).transform((c) => c.replace(/\s+/g, ' ')).default(''),
    mode: z.enum(PRICING_MODES, { errorMap: () => ({ message: 'Mode must be FIXED or HOURLY' }) }),
    basePrice: rupees('Base price'),
    durationMinutes: z.number({ required_error: 'Duration is required' }).int().min(5, 'Duration must be at least 5 minutes').max(1440),
    addOns: z.array(z.object({ name: z.string().trim().min(1, 'Add-on name is required').max(60), price: rupees('Add-on price') })).max(20).default([]),
    surgeWindows: z.array(surgeWindowSchema).max(10).default([]),
    cancellationFee: rupees('Cancellation fee'),
    active: z.boolean().default(true),
  })
  .superRefine((body, ctx) => {
    const sorted = body.surgeWindows
      .map((w, index) => ({ index, s: toMin(w.startTime), e: toMin(w.endTime) }))
      .sort((a, b) => a.s - b.s);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].s < sorted[i - 1].e) {
        ctx.addIssue({ code: 'custom', message: 'Surge windows cannot overlap', path: ['surgeWindows', sorted[i].index, 'startTime'] });
      }
    }
  });

export const getPricingQuerySchema = z.object({
  categoryId: objectIdString.optional(),
  serviceId: objectIdString.optional(),
  city: z.string().trim().max(100).optional(),
});

export const pricingIdParamSchema = z.object({ id: objectIdString });

export const quoteBodySchema = z.object({
  serviceId: objectIdString,
  quantity: z.number().int().min(1).max(20),
  addOns: z
    .array(z.object({ addOnId: objectIdString, quantity: z.number().int().min(1).max(20) }))
    .max(20)
    .default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  slot: z.enum(SERVICE_SLOTS, { message: 'Unrecognized slot' }),
  city: z.string().trim().max(100).optional(),
  couponCode: z.string().trim().min(1).max(30).optional(),
});

export type PutPricingBody = z.infer<typeof putPricingBodySchema>;
export type GetPricingQuery = z.infer<typeof getPricingQuerySchema>;

export const pricingValidation = { quoteBodySchema, putPricingBodySchema, getPricingQuerySchema };
