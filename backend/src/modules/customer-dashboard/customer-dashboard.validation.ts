import { z } from 'zod';

/**
 * The dashboard always belongs to the signed-in customer (taken from the token).
 * `customerId` is accepted only so a mismatch can be rejected with 403; any other
 * query parameter is rejected with 400.
 */
export const customerDashboardQuerySchema = z
  .object({ customerId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid customer id').optional() })
  .strict();

export type CustomerDashboardQuery = z.infer<typeof customerDashboardQuerySchema>;
