import { Router } from 'express';

import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { bookingsController } from './bookings.controller';

import {
  createBookingBodySchema,
  getBookingParamsSchema,
  getSlotsParamsSchema,
  getSlotsQuerySchema,
} from './bookings.validation';

export const bookingsRoutes = Router();

bookingsRoutes.get(
  '/services/:id/slots',
  validationMiddleware(getSlotsParamsSchema, 'params'),
  validationMiddleware(getSlotsQuerySchema, 'query'),
  asyncHandler(async (req, res) => bookingsController.getSlots(req, res)),
);

bookingsRoutes.post(
  '/bookings',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware(createBookingBodySchema, 'body'),
  asyncHandler(async (req, res) => bookingsController.createBooking(req, res)),
);

bookingsRoutes.get(
  '/bookings/:id',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware(getBookingParamsSchema, 'params'),
  asyncHandler(async (req, res) => bookingsController.getBooking(req, res)),
);

export default bookingsRoutes;