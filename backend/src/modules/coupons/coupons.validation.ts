import { z } from 'zod';

const objectId = z.string().trim().regex(/^[a-f\d]{24}$/i, 'Invalid category id');

const baseCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Coupon code must be at least 3 characters')
    .max(30, 'Coupon code must be 30 characters or fewer')
    .regex(/^[A-Za-z0-9_-]+$/, 'Coupon code can contain only letters, numbers, _ and -')
    .transform((value) => value.toUpperCase()),

  type: z.enum(['PERCENT', 'FLAT']),

  value: z.number().min(0, 'Value cannot be negative'),

  maxDiscount: z.number().min(0).nullable().optional(),

  minOrder: z.number().min(0).default(0),

  startAt: z.coerce.date(),

  endAt: z.coerce.date(),

  totalLimit: z.number().int().min(0).nullable().optional(),

  perUserLimit: z.number().int().min(0).nullable().optional(),

  categoryIds: z.array(objectId).default([]),

  active: z.boolean().default(true),
});

export const couponCreateSchema = baseCouponSchema.superRefine((data, ctx) => {
  if (data.endAt <= data.startAt) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['endAt'],
      message: 'End date must be after start date',
    });
  }

  if (data.type === 'PERCENT' && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['value'],
      message: 'Percentage value cannot exceed 100',
    });
  }
});

export const couponUpdateSchema = baseCouponSchema
  .partial()
  .superRefine((data, ctx) => {
    if (data.startAt && data.endAt && data.endAt <= data.startAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'End date must be after start date',
      });
    }

    if (data.type === 'PERCENT' && data.value !== undefined && data.value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Percentage value cannot exceed 100',
      });
    }
  });

export const couponsValidation = {
  couponCreateSchema,
  couponUpdateSchema,
};
