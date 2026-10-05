import { z } from 'zod';
import { Types } from 'mongoose';
import {
  CUSTOMER_SORT_FIELDS,
  CUSTOMER_STATUSES,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_SEARCH_LENGTH,
  REASON_MAX_LENGTH,
  REASON_MIN_LENGTH,
} from './admin-customers.constants';

/** "?status=" (empty) means "no filter", same as leaving the param out. */
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const listCustomersQuerySchema = z.object({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(MAX_SEARCH_LENGTH, 'Search is too long').optional()),
  status: z.preprocess(emptyToUndefined, z.enum(CUSTOMER_STATUSES).optional()),
  sortBy: z.preprocess(emptyToUndefined, z.enum(CUSTOMER_SORT_FIELDS).default('createdAt')),
  sortDir: z.preprocess(emptyToUndefined, z.enum(['asc', 'desc']).default('desc')),
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE)),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const customerIdParamSchema = z.object({
  id: z.string().refine((v) => Types.ObjectId.isValid(v) && String(new Types.ObjectId(v)) === v, 'Invalid customer id'),
});

/** The admin must say why: the reason is stored in the audit log for both block and unblock. */
export const updateCustomerStatusSchema = z.object({
  status: z.enum(CUSTOMER_STATUSES),
  reason: z
    .string({ required_error: 'A reason is required' })
    .trim()
    .min(REASON_MIN_LENGTH, `Reason must be at least ${REASON_MIN_LENGTH} characters`)
    .max(REASON_MAX_LENGTH, `Reason must be at most ${REASON_MAX_LENGTH} characters`),
});

export type UpdateCustomerStatusBody = z.infer<typeof updateCustomerStatusSchema>;

/** Edit name / email / phone. An empty phone clears it. */
export const updateCustomerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string({ required_error: 'Email is required' }).trim().toLowerCase().email('Enter a valid email').max(254, 'Email is too long'),
  phone: z.preprocess(
    emptyToUndefined,
    z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
  ),
});

export type UpdateCustomerBody = z.infer<typeof updateCustomerSchema>;

/** Removing a customer is permanent, so the reason is stored in the audit log. */
export const deleteCustomerSchema = z.object({
  reason: z
    .string({ required_error: 'A reason is required' })
    .trim()
    .min(REASON_MIN_LENGTH, `Reason must be at least ${REASON_MIN_LENGTH} characters`)
    .max(REASON_MAX_LENGTH, `Reason must be at most ${REASON_MAX_LENGTH} characters`),
});

export type DeleteCustomerBody = z.infer<typeof deleteCustomerSchema>;
