import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireAdmin, roleMiddleware } from '../../middleware/role.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { validate, validationMiddleware } from '../../middleware/validation.middleware';
import { pricingController } from './pricing.controller';
import { getPricingQuerySchema, pricingIdParamSchema, putPricingBodySchema, quoteBodySchema } from './pricing.validation';

/** Mounted at /api/v1/pricing */
export const pricingRoutes = Router();

// POST /pricing/quote: the price the customer will be charged for this exact order
pricingRoutes.post(
  '/quote',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware({ body: quoteBodySchema }),
  asyncHandler(async (req, res) => pricingController.quote(req, res)),
);

/** Mounted at /api/v1/admin/pricing. Admin role + `pricing:manage`. */
export const adminPricingRoutes = Router();
adminPricingRoutes.use(authMiddleware, requireAdmin, requirePermission('pricing:manage'));

// GET /admin/pricing?categoryId=&serviceId=&city=
adminPricingRoutes.get('/', validate(getPricingQuerySchema, 'query'), asyncHandler((req, res) => pricingController.adminList(req, res)));

// PUT /admin/pricing  (create or replace the rule for categoryId + serviceId? + city)
adminPricingRoutes.put('/', validate(putPricingBodySchema, 'body'), asyncHandler((req, res) => pricingController.adminSave(req, res)));

// DELETE /admin/pricing/:id
adminPricingRoutes.delete('/:id', validate(pricingIdParamSchema, 'params'), asyncHandler((req, res) => pricingController.adminRemove(req, res)));

export default pricingRoutes;
