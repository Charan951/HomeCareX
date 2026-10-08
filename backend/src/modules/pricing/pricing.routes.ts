import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { pricingController } from './pricing.controller';
import { quoteBodySchema } from './pricing.validation';

export const pricingRoutes = Router();

// POST /pricing/quote: the price the customer will be charged for this exact order
pricingRoutes.post(
  '/quote',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware({ body: quoteBodySchema }),
  asyncHandler(async (req, res) => pricingController.quote(req, res)),
);

export default pricingRoutes;