import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { addressesController } from './addresses.controller';
import {
  addressParamsSchema,
  createAddressBodySchema,
  serviceabilityQuerySchema,
  updateAddressBodySchema,
} from './addresses.validation';

const checkServiceability = [
  validationMiddleware({ query: serviceabilityQuerySchema }),
  asyncHandler(async (req, res) => addressesController.serviceability(req, res)),
];

/** GET /serviceability?pincode=500081 */
export const serviceabilityRoutes = Router();
serviceabilityRoutes.use(authMiddleware, roleMiddleware('customer'));
serviceabilityRoutes.get('/', ...checkServiceability);

export const addressesRoutes = Router();
addressesRoutes.use(authMiddleware, roleMiddleware('customer'));

// GET /addresses/serviceability?pincode=500081: the original path, kept so existing clients keep working.
// Must stay above '/:id'.
addressesRoutes.get('/serviceability', ...checkServiceability);

// GET /addresses
addressesRoutes.get('/', asyncHandler(async (req, res) => addressesController.list(req, res)));

// POST /addresses
addressesRoutes.post(
  '/',
  validationMiddleware({ body: createAddressBodySchema }),
  asyncHandler(async (req, res) => addressesController.create(req, res)),
);

// PATCH /addresses/:id (edit, set default). PUT is the original verb, kept as an alias for existing clients.
addressesRoutes
  .route('/:id')
  .patch(
    validationMiddleware({ params: addressParamsSchema, body: updateAddressBodySchema }),
    asyncHandler(async (req, res) => addressesController.update(req, res)),
  )
  .put(
    validationMiddleware({ params: addressParamsSchema, body: updateAddressBodySchema }),
    asyncHandler(async (req, res) => addressesController.update(req, res)),
  )
  // DELETE /addresses/:id
  .delete(
    validationMiddleware({ params: addressParamsSchema }),
    asyncHandler(async (req, res) => addressesController.remove(req, res)),
  );
