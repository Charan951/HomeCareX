import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { auditRoutes } from '../modules/audit/audit.routes';
// import { partnersRoutes } from '../modules/partners/partner-dashboard.routes';
import { availabilityRoutes } from '../modules/availability/availability.routes';
import { partnerDashboardRoutes } from '../modules/partners/partner-dashboard.routes';

import leadsRoutes from '../modules/leads/leads.routes';
import { bookingsRoutes } from '../modules/bookings/bookings.routes';

export const rootRouter = Router();

// Routes are registered under /api/v1. Add new modules here; don't replace the list.
rootRouter.use('/auth', authRoutes);
rootRouter.use('/admin', auditRoutes); // GET /admin/audit-logs
// rootRouter.use('/admin/partners', partnersRoutes);
rootRouter.use('/partner/dashboard', partnerDashboardRoutes);
rootRouter.use('/partner/availability', availabilityRoutes);
rootRouter.use(leadsRoutes); // POST /public/leads
rootRouter.use(bookingsRoutes); // GET /services/:id/slots, POST /bookings, GET /bookings/:id

export default rootRouter;