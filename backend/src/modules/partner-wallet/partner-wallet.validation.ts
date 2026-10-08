import { z } from 'zod';
import { isRealDate } from '../../utils/dates';
import { WALLET_TRANSACTION_TYPES } from './partner-wallet.constants';

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine(isRealDate, 'Not a real calendar date');

/**
 * GET /partner/transactions  ?type&from&to&page&limit
 * `partnerId` is accepted only so that someone else's id can be answered with 404 (never trusted).
 */
export const transactionsQuerySchema = z
  .object({
    type: z.enum(WALLET_TRANSACTION_TYPES).optional(),
    from: dateField.optional(),
    to: dateField.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    partnerId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid partner id').optional(),
  })
  .strict()
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: '"from" must be on or before "to"', path: ['from'] });

export type TransactionsQuery = z.infer<typeof transactionsQuerySchema>;