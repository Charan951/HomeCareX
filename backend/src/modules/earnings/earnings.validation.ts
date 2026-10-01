import { z } from 'zod';

/** Summary is always the signed-in partner's. `partnerId` is accepted only so someone else's id can be answered with 404. */
export const summaryQuerySchema = z
  .object({ partnerId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid partner id').optional() })
  .strict();