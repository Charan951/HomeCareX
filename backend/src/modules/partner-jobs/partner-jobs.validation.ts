import { z } from 'zod';
import { PARTNER_STATUS_TARGETS } from './partner-jobs.types';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const jobParamsSchema = z.object({ id: objectId }).strict();

/** Any status string is accepted here so the service can answer 422 (not 400) for transitions a partner may not make. */
export const statusBodySchema = z
  .object({
    status: z.string({ required_error: 'status is required' }).min(1, 'status is required'),
    reason: z.string().trim().max(300).optional(),
  })
  .strict();

export type StatusBody = z.infer<typeof statusBodySchema>;
export const isPartnerTarget = (s: string): s is (typeof PARTNER_STATUS_TARGETS)[number] =>
  (PARTNER_STATUS_TARGETS as readonly string[]).includes(s);