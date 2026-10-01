import { z } from 'zod';
import { isRealDate, parseLocalDate } from '../../utils/dates';
import { EARNING_STATUSES } from './earnings.constants';

/** Summary is always the signed-in partner's. `partnerId` is accepted only so someone else's id can be answered with 404. */
export const summaryQuerySchema = z
  .object({ partnerId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid partner id').optional() })
  .strict();

export const MAX_RANGE_DAYS = 366;

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isRealDate, 'Not a real calendar date');

const filterShape = {
  from: dateField.optional(),
  to: dateField.optional(),
  status: z.enum(EARNING_STATUSES).optional(),
};

type Range = { from?: string; to?: string };

const rangeIsOrdered = (q: Range): boolean => !q.from || !q.to || q.from <= q.to;
const rangeIsShortEnough = (q: Range): boolean =>
  !q.from || !q.to || (parseLocalDate(q.to).getTime() - parseLocalDate(q.from).getTime()) / 86_400_000 < MAX_RANGE_DAYS;

/** GET /partner/earnings */
export const ledgerQuerySchema = z
  .object({
    ...filterShape,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(rangeIsOrdered, { message: '"from" must be on or before "to"', path: ['from'] })
  .refine(rangeIsShortEnough, { message: `Range can be at most ${MAX_RANGE_DAYS} days`, path: ['to'] });

/** GET /partner/earnings/export (no paging: the file holds every matching row) */
export const exportQuerySchema = z
  .object(filterShape)
  .strict()
  .refine(rangeIsOrdered, { message: '"from" must be on or before "to"', path: ['from'] })
  .refine(rangeIsShortEnough, { message: `Range can be at most ${MAX_RANGE_DAYS} days`, path: ['to'] });

export type LedgerQuery = z.infer<typeof ledgerQuerySchema>;
export type ExportQuery = z.infer<typeof exportQuerySchema>;