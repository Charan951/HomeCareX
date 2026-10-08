import { z } from 'zod';

const dateSchema = z.coerce.date({
  message: 'Invalid date',
});

const baseBannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters')
    .max(120, 'Title must not exceed 120 characters'),

  image: z
    .string()
    .trim()
    .url('Image must be a valid URL'),

  link: z
    .string()
    .trim()
    .url('Link must be a valid URL')
    .or(z.literal('')),

  placement: z.enum([
    'HOME',
    'HOME_TOP',
    'HOME_MIDDLE',
    'HOME_BOTTOM',
  ]),

  startAt: dateSchema,

  endAt: dateSchema,

  order: z
    .coerce
    .number()
    .int('Order must be a whole number')
    .min(0, 'Order cannot be negative'),

  active: z.boolean(),
});

export const marketingValidation = {
  bannerCreateSchema: baseBannerSchema.superRefine(
    (data, ctx) => {
      if (data.endAt <= data.startAt) {
        ctx.addIssue({
          code: 'custom',
          path: ['endAt'],
          message: 'End date must be after start date',
        });
      }
    },
  ),

  bannerUpdateSchema: baseBannerSchema
    .partial()
    .superRefine((data, ctx) => {
      if (
        data.startAt &&
        data.endAt &&
        data.endAt <= data.startAt
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['endAt'],
          message: 'End date must be after start date',
        });
      }
    }),
};
