import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { getEarningsSummary } from './earnings.controller';
import { summaryQuerySchema } from './earnings.validation';

export const earningsRoutes = Router();

// GET /api/v1/partner/earnings/summary  (role: partner, permission: partner:earnings:read)
earningsRoutes.get(
  '/summary',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:earnings:read'),
  validate(summaryQuerySchema, 'query'),
  getEarningsSummary,
);

export default earningsRoutes;