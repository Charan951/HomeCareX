import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { couponsController } from './coupons.controller';

export const couponsRoutes = Router();

/**
 * Admin coupon management
 *
 * Mounted at:
 * /api/v1/admin/coupons
 */
couponsRoutes.use(authenticate, requireAdmin);

couponsRoutes.get(
  '/',
  asyncHandler((req, res) =>
    couponsController.list(req, res),
  ),
);

couponsRoutes.get(
  '/:id',
  asyncHandler((req, res) =>
    couponsController.getById(req, res),
  ),
);

couponsRoutes.post(
  '/',
  asyncHandler((req, res) =>
    couponsController.create(req, res),
  ),
);

couponsRoutes.patch(
  '/:id',
  asyncHandler((req, res) =>
    couponsController.update(req, res),
  ),
);

couponsRoutes.delete(
  '/:id',
  asyncHandler((req, res) =>
    couponsController.remove(req, res),
  ),
);

/**
 * Customer coupon validation
 *
 * Mounted at:
 * /api/v1/coupons/validate
 */
export const couponCustomerRoutes = Router();

couponCustomerRoutes.use(authenticate);

couponCustomerRoutes.post(
  '/validate',
  asyncHandler((req, res) =>
    couponsController.validate(req, res),
  ),
);

couponCustomerRoutes.post(
  '/available',
  asyncHandler((req, res) =>
    couponsController.listAvailable(req, res),
  ),
);

export default couponsRoutes;