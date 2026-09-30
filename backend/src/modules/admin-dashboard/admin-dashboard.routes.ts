import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { adminDashboardController } from './admin-dashboard.controller';

/**
 * Mounted at /api/v1/admin/dashboard. Admin only.
 * Query (both endpoints): preset=today|7d|30d|90d|this_month|last_month  OR  from=YYYY-MM-DD&to=YYYY-MM-DD, optional city. Max 365 days.
 */
export const adminDashboardRoutes = Router();
adminDashboardRoutes.use(authenticate, requireAdmin);

adminDashboardRoutes.get('/summary', adminDashboardController.summary); // KPIs + snapshot + city list
adminDashboardRoutes.get('/trends', adminDashboardController.trends); //   revenue/bookings series, category split, funnel

export default adminDashboardRoutes;
