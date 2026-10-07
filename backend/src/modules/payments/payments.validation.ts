import { z } from 'zod';
import { PAYMENT_METHODS } from './payments.constants';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');
const nonEmpty = z.string().trim().min(1).max(200);

/**
 * Bodies are strict on purpose: an `amount` (or anything else) sent by the client is rejected,
 * so the charge can only ever come from the booking's stored price snapshot.
 */
export const orderBodySchema = z
  .object({ bookingId: objectId, method: z.enum(PAYMENT_METHODS).optional() })
  .strict();

export const verifyBodySchema = z
  .object({
    bookingId: objectId,
    razorpay_order_id: nonEmpty,
    razorpay_payment_id: nonEmpty,
    razorpay_signature: nonEmpty,
  })
  .strict();

export const attemptBodySchema = z
  .object({
    bookingId: objectId,
    orderId: nonEmpty.optional(),
    kind: z.enum(['CANCELLED', 'FAILED']),
    reason: z.string().trim().max(200).optional(),
  })
  .strict();

export const codBodySchema = z.object({ bookingId: objectId }).strict();

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export const paymentsValidation = { orderBodySchema, verifyBodySchema, attemptBodySchema, codBodySchema, listQuerySchema };
