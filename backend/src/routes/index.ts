import { Router } from 'express';
import paymentRoutes from '../modules/payments/payments.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { auditRoutes } from '../modules/audit/audit.routes';
import { partnersRoutes } from '../modules/partners/partners.routes';
import { availabilityRoutes } from '../modules/availability/availability.routes';

import leadsRoutes from '../modules/leads/leads.routes';

import { bookingsRoutes } from '../modules/bookings/bookings.routes';
import { addressesRoutes } from '../modules/addresses/addresses.routes';

export const rootRouter = Router();

// Routes are registered under /api/v1. Add new modules here; don't replace the list.
rootRouter.use('/auth', authRoutes);
rootRouter.use('/admin', auditRoutes); // GET /admin/audit-logs
rootRouter.use('/admin/partners', partnersRoutes);
rootRouter.use('/partner/availability', availabilityRoutes);
rootRouter.use(leadsRoutes); // POST /public/leads
rootRouter.use(bookingsRoutes); // GET /services/:id/slots, POST /bookings/check-slot, POST /bookings, GET /bookings/:id
rootRouter.use('/addresses', addressesRoutes); // GET/POST /addresses, GET /addresses/serviceability
rootRouter.use('/payments', paymentRoutes);
export default rootRouter;