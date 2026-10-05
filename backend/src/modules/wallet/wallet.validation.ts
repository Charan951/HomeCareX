import { z } from 'zod';
import { LEDGER_TYPES } from './wallet.constants';

export const walletQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  type: z.enum(LEDGER_TYPES).optional(),
});
export type WalletQuery = z.infer<typeof walletQuerySchema>;
