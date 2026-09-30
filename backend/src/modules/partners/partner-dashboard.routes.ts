import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { getPartnerDashboard } from './partner-dashboard.controller';
import { dashboardQuerySchema } from './partner-dashboard.validation';

export const partnerDashboardRoutes = Router();

// GET /api/v1/partner/dashboard  (role: partner, permission: partner:dashboard)
partnerDashboardRoutes.get(
  '/',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:dashboard'),
  validate(dashboardQuerySchema, 'query'),
  getPartnerDashboard,
);

export default partnerDashboardRoutes;