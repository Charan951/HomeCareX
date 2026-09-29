import type { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { partnerDashboardService } from './partner-dashboard.service';

export const getPartnerDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { sub } = res.locals.auth as { sub: string };
  const partnerId = typeof req.query.partnerId === 'string' ? req.query.partnerId : undefined;
  const data = await partnerDashboardService.getDashboard(sub, partnerId);
  sendSuccess(res, data);
});