import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { partnerWalletService } from './partner-wallet.service';
import type { TransactionsQuery } from './partner-wallet.validation';

/** req.query was already parsed and replaced by validate(transactionsQuerySchema, 'query'). */
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  sendSuccess(res, await partnerWalletService.getTransactions(sub, req.query as unknown as TransactionsQuery));
});

export const getWalletSummary = asyncHandler(async (_req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  sendSuccess(res, await partnerWalletService.getSummary(sub));
});