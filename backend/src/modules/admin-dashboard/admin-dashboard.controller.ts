import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { adminDashboardService } from './admin-dashboard.service';

export const adminDashboardController = {
  summary: asyncHandler(async (req, res) => sendSuccess(res, await adminDashboardService.summary(req.query))),
  trends: asyncHandler(async (req, res) => sendSuccess(res, await adminDashboardService.trends(req.query))),
};
