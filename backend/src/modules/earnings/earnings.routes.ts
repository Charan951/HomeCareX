import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { exportEarnings, getEarningsLedger, getEarningsSummary } from './earnings.controller';
import { exportQuerySchema, ledgerQuerySchema, summaryQuerySchema } from './earnings.validation';

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

// GET /api/v1/partner/earnings  ?from&to&status&page&limit
earningsRoutes.get(
  '/',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:earnings:read'),
  validate(ledgerQuerySchema, 'query'),
  getEarningsLedger,
);

// GET /api/v1/partner/earnings/export  ?from&to&status  -> text/csv download
earningsRoutes.get(
  '/export',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:earnings:read'),
  validate(exportQuerySchema, 'query'),
  exportEarnings,
);

export default earningsRoutes;