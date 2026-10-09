import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { getPartnerJob, updateBookingStatus } from './partner-jobs.controller';
import { jobParamsSchema, statusBodySchema } from './partner-jobs.validation';

/** Mounted at /partner/jobs */
export const partnerJobsRoutes = Router();

// GET /api/v1/partner/jobs/:id  (role: partner, permission: partner:jobs:read, own jobs only)
partnerJobsRoutes.get(
  '/:id',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:jobs:read'),
  validationMiddleware({ params: jobParamsSchema }),
  getPartnerJob,
);

/** Mounted at /bookings */
export const bookingStatusRoutes = Router();

// PATCH /api/v1/bookings/:id/status  { status: 'en_route' | 'arrived', reason? }
bookingStatusRoutes.patch(
  '/:id/status',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:jobs:update'),
  validationMiddleware({ params: jobParamsSchema, body: statusBodySchema }),
  updateBookingStatus,
);

export default partnerJobsRoutes;