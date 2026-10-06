import { Types } from 'mongoose';
import { z } from 'zod';
import { AVAILABILITY_FILTERS, LIMIT_DEFAULT, LIMIT_MAX, PAGE_DEFAULT, PAGE_MAX, PRICE_MAX, Q_MAX_LENGTH, SERVICE_SORTS } from './catalog.constants';

/** "?q=" (empty) is treated as "not sent" so a cleared search box never errors. */
const blankToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const num = (label: string, min: number, max: number, int = false) => {
  const base = z.coerce.number({ invalid_type_error: `${label} must be a number` }).finite(`${label} must be a number`);
  const n = (int ? base.int(`${label} must be a whole number`) : base)
    .min(min, `${label} must be at least ${min}`)
    .max(max, `${label} must be at most ${max}`);
  return z.preprocess(blankToUndefined, n.optional());
};

const slugOrId = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine((v) => Types.ObjectId.isValid(v) || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'Must be a category id or slug');

/** Categories take no query params; `.strict()` makes any stray param a 400. */
export const categoryQuerySchema = z.object({}).strict();

export const serviceQuerySchema = z
  .object({
    q: z.preprocess(blankToUndefined, z.string().trim().min(1).max(Q_MAX_LENGTH, `q must be at most ${Q_MAX_LENGTH} characters`).optional()),
    category: z.preprocess(blankToUndefined, slugOrId.optional()),
    rating: num('rating', 0, 5),
    minPrice: num('minPrice', 0, PRICE_MAX),
    maxPrice: num('maxPrice', 0, PRICE_MAX),
    /** Longest acceptable duration, in minutes. */
    duration: num('duration', 5, 1440, true),
    availability: z.preprocess(blankToUndefined, z.enum(AVAILABILITY_FILTERS as [string, ...string[]], { errorMap: () => ({ message: `availability must be one of: ${AVAILABILITY_FILTERS.join(', ')}` }) }).optional()),
    sort: z.preprocess(blankToUndefined, z.enum(SERVICE_SORTS, { errorMap: () => ({ message: `sort must be one of: ${SERVICE_SORTS.join(', ')}` }) }).optional()),
    page: z.preprocess(blankToUndefined, z.coerce.number().int('page must be a whole number').min(1, 'page must be at least 1').max(PAGE_MAX, `page must be at most ${PAGE_MAX}`).default(PAGE_DEFAULT)),
    limit: z.preprocess(blankToUndefined, z.coerce.number().int('limit must be a whole number').min(1, 'limit must be at least 1').max(LIMIT_MAX, `limit must be at most ${LIMIT_MAX}`).default(LIMIT_DEFAULT)),
  })
  .strict()
  .refine((v) => v.minPrice === undefined || v.maxPrice === undefined || v.minPrice <= v.maxPrice, {
    path: ['minPrice'],
    message: 'minPrice cannot be greater than maxPrice',
  });

export type ServiceQuery = z.infer<typeof serviceQuerySchema>;

export const serviceParamSchema = z.object({ idOrSlug: slugOrId });
