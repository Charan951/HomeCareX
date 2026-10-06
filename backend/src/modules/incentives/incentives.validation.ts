import { z } from 'zod';

/** GET /partner/incentives takes no query. Unknown fields are rejected rather than silently ignored. */
export const listQuerySchema = z.object({}).strict();

/** GET /partner/incentives/:id */
export const idParamSchema = z
  .object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid incentive id') })
  .strict();