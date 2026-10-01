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
  checkSlotBodySchema,
} from './bookings.validation';

export const bookingsRoutes = Router();

// GET /services/:id/slots?date=YYYY-MM-DD
bookingsRoutes.get(
  '/services/:id/slots',
  validationMiddleware({ params: getSlotsParamsSchema, query: getSlotsQuerySchema }),
  asyncHandler(async (req, res) => bookingsController.getSlots(req, res))
);

// POST /bookings/check-slot — Real-time slot verification when clicking "Next Step"
bookingsRoutes.post(
  '/bookings/check-slot',
  validationMiddleware({ body: checkSlotBodySchema }),
  asyncHandler(async (req, res) => bookingsController.checkSlot(req, res))
);

// POST /bookings — Pay & Confirm (returns 201 Created or 409 Conflict if slot was taken)
bookingsRoutes.post(
  '/bookings',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware({ body: createBookingBodySchema }),
  asyncHandler(async (req, res) => bookingsController.createBooking(req, res))
);

// GET /bookings — List all customer bookings
bookingsRoutes.get(
  '/bookings',
  authMiddleware,
  roleMiddleware('customer'),
  asyncHandler(async (req, res) => bookingsController.listBookings(req, res))
);

// GET /bookings/:id — Get details of a single booking
bookingsRoutes.get(
  '/bookings/:id',
  authMiddleware,
  roleMiddleware('customer'),
  validationMiddleware({ params: getBookingParamsSchema }),
  asyncHandler(async (req, res) => bookingsController.getBooking(req, res))
);

export default bookingsRoutes;