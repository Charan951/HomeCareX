import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';

import { adminBookingsController } from './admin-bookings.controller';

export const adminRoutes = Router();

adminRoutes.use(authenticate, requireAdmin);

adminRoutes.get(
  '/bookings',
  asyncHandler((req, res) =>
    adminBookingsController.getBookings(req, res),
  ),
);

adminRoutes.get(
  '/bookings/:bookingId',
  asyncHandler((req, res) =>
    adminBookingsController.getBookingById(req, res),
  ),
);

adminRoutes.get(
  '/bookings/:bookingId/eligible-partners',
  asyncHandler((req, res) =>
    adminBookingsController.getEligiblePartners(req, res),
  ),
);

adminRoutes.patch(
  '/bookings/:bookingId/assign',
  asyncHandler((req, res) =>
    adminBookingsController.assignPartner(req, res),
  ),
);

adminRoutes.patch(
  '/bookings/:bookingId/status',
  asyncHandler((req, res) =>
    adminBookingsController.overrideStatus(req, res),
  ),
);