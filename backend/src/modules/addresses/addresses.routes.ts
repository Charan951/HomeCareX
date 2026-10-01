import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { createAddress, deleteAddress, listAddresses, setDefaultAddress, updateAddress } from './addresses.controller';
import { addressIdParamsSchema, createAddressBodySchema, updateAddressBodySchema } from './addresses.validation';

export const addressesRoutes = Router();

// /api/v1/customer/addresses  (role: customer; every query is scoped to the token's user)
addressesRoutes.use(authenticate, requireRole('customer'));

addressesRoutes.get('/', listAddresses);
addressesRoutes.post('/', validate(createAddressBodySchema, 'body'), createAddress);
addressesRoutes.patch('/:id', validate(addressIdParamsSchema, 'params'), validate(updateAddressBodySchema, 'body'), updateAddress);
addressesRoutes.put('/:id/default', validate(addressIdParamsSchema, 'params'), setDefaultAddress);
addressesRoutes.delete('/:id', validate(addressIdParamsSchema, 'params'), deleteAddress);

export default addressesRoutes;
