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

// GET /services/:id/slots?date=YYYY-MM-DD — public: anyone browsing services can see availability.
bookingsRoutes.get(
  '/services/:id/slots',
  validationMiddleware({ params: getSlotsParamsSchema, query: getSlotsQuerySchema }),
  asyncHandler(async (req, res) => bookingsController.getSlots(req, res)),
);

// POST /bookings — customer only, requires Idempotency-Key.
bookingsRoutes.post(
  '/bookings',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware({ body: createBookingBodySchema }),
  asyncHandler(async (req, res) => bookingsController.createBooking(req, res)),
);

// GET /bookings/:id — customer only, and only their own booking.
bookingsRoutes.get(
  '/bookings/:id',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware({ params: getBookingParamsSchema }),
  asyncHandler(async (req, res) => bookingsController.getBooking(req, res)),
);
