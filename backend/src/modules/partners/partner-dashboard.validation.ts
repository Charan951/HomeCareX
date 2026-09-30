import { z } from 'zod';

/** The dashboard always belongs to the signed-in partner. `partnerId` is accepted only so a mismatch can be rejected with 403. */
export const dashboardQuerySchema = z
  .object({ partnerId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid partner id').optional() })
  .strict();