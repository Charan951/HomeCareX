import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { earningsService } from './earnings.service';

export const getEarningsSummary = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  const partnerId = typeof req.query.partnerId === 'string' ? req.query.partnerId : undefined;
  sendSuccess(res, await earningsService.getSummary(sub, partnerId));
});