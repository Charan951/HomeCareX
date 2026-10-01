import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/auth.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { customerDashboardService } from './customer-dashboard.service';

export const getCustomerDashboard = asyncHandler(async (req: Request, res: Response) => {
  const { id } = getAuthUser(req); // identity comes from the token, never from the request
  const customerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;
  const data = await customerDashboardService.getDashboard(id, customerId);
  res.set('Cache-Control', 'private, no-store'); // per-user data must never be cached by a shared proxy
  sendSuccess(res, data);
});
