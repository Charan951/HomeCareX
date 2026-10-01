import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { getCustomerDashboard } from './customer-dashboard.controller';
import { customerDashboardQuerySchema } from './customer-dashboard.validation';

export const customerDashboardRoutes = Router();

// GET /api/v1/customer/dashboard  (role: customer)
customerDashboardRoutes.get(
  '/',
  authenticate,
  requireRole('customer'),
  validate(customerDashboardQuerySchema, 'query'),
  getCustomerDashboard,
);

export default customerDashboardRoutes;
