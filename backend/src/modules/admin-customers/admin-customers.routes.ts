import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { adminCustomersController } from './admin-customers.controller';
import {
  customerIdParamSchema,
  deleteCustomerSchema,
  listCustomersQuerySchema,
  updateCustomerSchema,
  updateCustomerStatusSchema,
} from './admin-customers.validation';

/** Mounted at /api/v1/admin/customers. Admin only. */
export const adminCustomersRoutes = Router();

adminCustomersRoutes.use(authenticate, requireAdmin);

// GET /admin/customers?search=&status=active|blocked&sortBy=&sortDir=asc|desc&page=1&limit=10
adminCustomersRoutes.get(
  '/',
  validate(listCustomersQuerySchema, 'query'),
  asyncHandler((req, res) => adminCustomersController.list(req, res)),
);

// GET /admin/customers/:id -> overview + bookings, addresses, payments, activity, support, reviews
adminCustomersRoutes.get(
  '/:id',
  validate(customerIdParamSchema, 'params'),
  asyncHandler((req, res) => adminCustomersController.getById(req, res)),
);

// PATCH /admin/customers/:id/status  { status: 'active' | 'blocked', reason }
// Block -> status -> revoke sessions -> recordAudit
adminCustomersRoutes.patch(
  '/:id/status',
  validate(customerIdParamSchema, 'params'),
  validate(updateCustomerStatusSchema, 'body'),
  asyncHandler((req, res) => adminCustomersController.updateStatus(req, res)),
);

// PATCH /admin/customers/:id  { name, email, phone? }
adminCustomersRoutes.patch(
  '/:id',
  validate(customerIdParamSchema, 'params'),
  validate(updateCustomerSchema, 'body'),
  asyncHandler((req, res) => adminCustomersController.update(req, res)),
);

// DELETE /admin/customers/:id  { reason }. 409 if the customer has bookings (block them instead).
adminCustomersRoutes.delete(
  '/:id',
  validate(customerIdParamSchema, 'params'),
  validate(deleteCustomerSchema, 'body'),
  asyncHandler((req, res) => adminCustomersController.remove(req, res)),
);

export default adminCustomersRoutes;
