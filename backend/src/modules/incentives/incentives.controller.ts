import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { incentivesService } from './incentives.service';

export const listIncentives = asyncHandler(async (_req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  sendSuccess(res, await incentivesService.list(sub));
});

export const getIncentive = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  sendSuccess(res, await incentivesService.get(sub, req.params.id));
});