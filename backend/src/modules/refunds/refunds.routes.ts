import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { refundsController } from './refunds.controller';

export const refundsRoutes = Router();

refundsRoutes.use(authenticate, requireAdmin);

refundsRoutes.get(
  '/refunds',
  asyncHandler((req, res) =>
    refundsController.list(req, res),
  ),
);

refundsRoutes.post(
  '/refunds',
  asyncHandler((req, res) =>
    refundsController.create(req, res),
  ),
);

refundsRoutes.patch(
  '/refunds/:id',
  asyncHandler((req, res) =>
    refundsController.update(req, res),
  ),
);

export default refundsRoutes;