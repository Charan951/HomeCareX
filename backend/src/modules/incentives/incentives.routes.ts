import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { getIncentive, listIncentives } from './incentives.controller';
import { idParamSchema, listQuerySchema } from './incentives.validation';

export const incentivesRoutes = Router();

// GET /api/v1/partner/incentives  (role: partner, permission: partner:incentives:read)
incentivesRoutes.get(
  '/',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:incentives:read'),
  validate(listQuerySchema, 'query'),
  listIncentives,
);

// GET /api/v1/partner/incentives/:id
incentivesRoutes.get(
  '/:id',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:incentives:read'),
  validate(idParamSchema, 'params'),
  getIncentive,
);

export default incentivesRoutes;