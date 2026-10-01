import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { addressesController } from './addresses.controller';
import { addressParamsSchema, createAddressBodySchema, serviceabilityQuerySchema } from './addresses.validation';

export const addressesRoutes = Router();

addressesRoutes.use(authMiddleware, roleMiddleware('customer'));

// GET /addresses/serviceability?pincode=500072
addressesRoutes.get(
  '/serviceability',
  validationMiddleware({ query: serviceabilityQuerySchema }),
  asyncHandler(async (req, res) => addressesController.serviceability(req, res)),
);

// GET /addresses
addressesRoutes.get('/', asyncHandler(async (req, res) => addressesController.list(req, res)));

// POST /addresses
addressesRoutes.post(
  '/',
  validationMiddleware({ body: createAddressBodySchema }),
  asyncHandler(async (req, res) => addressesController.create(req, res)),
);

// PUT /addresses/:id (Edit)
addressesRoutes.put(
  '/:id',
  validationMiddleware({ params: addressParamsSchema, body: createAddressBodySchema.partial() }),
  asyncHandler(async (req, res) => addressesController.update(req, res)),
);

// DELETE /addresses/:id (Delete)
addressesRoutes.delete(
  '/:id',
  validationMiddleware({ params: addressParamsSchema }),
  asyncHandler(async (req, res) => addressesController.remove(req, res)),
);