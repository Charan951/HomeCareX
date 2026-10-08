import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

import {
  marketingController,
} from './marketing.controller';

export const marketingRoutes = Router();

/**
 * Admin banner management
 *
 * Mounted at:
 * /api/v1/admin/banners
 */
marketingRoutes.use(
  authenticate,
  requireAdmin,
);

marketingRoutes.get(
  '/',
  asyncHandler((req, res) =>
    marketingController.listAdmin(
      req,
      res,
    ),
  ),
);

marketingRoutes.get(
  '/:id',
  asyncHandler((req, res) =>
    marketingController.getById(
      req,
      res,
    ),
  ),
);

marketingRoutes.post(
  '/',
  asyncHandler((req, res) =>
    marketingController.create(
      req,
      res,
    ),
  ),
);

marketingRoutes.patch(
  '/:id',
  asyncHandler((req, res) =>
    marketingController.update(
      req,
      res,
    ),
  ),
);

marketingRoutes.delete(
  '/:id',
  asyncHandler((req, res) =>
    marketingController.remove(
      req,
      res,
    ),
  ),
);

/**
 * Public banner API
 *
 * Mounted at:
 * /api/v1/banners
 */
export const publicMarketingRoutes =
  Router();

publicMarketingRoutes.get(
  '/',
  asyncHandler((req, res) =>
    marketingController.listPublic(
      req,
      res,
    ),
  ),
);

export default marketingRoutes;
