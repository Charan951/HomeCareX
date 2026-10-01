import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes';
import { auditRoutes } from '../modules/audit/audit.routes';
import { partnersRoutes } from '../modules/partners/partners.routes';
import { availabilityRoutes } from '../modules/availability/availability.routes';
import { blackoutRoutes } from '../modules/availability/blackout.routes';
import { scheduleRoutes } from '../modules/availability/schedule.routes';
import { partnerDashboardRoutes } from '../modules/partners/partner-dashboard.routes';
import { adminDashboardRoutes } from '../modules/admin-dashboard/admin-dashboard.routes';
import { settingsRoutes } from '../modules/settings/settings.routes';
import { designationsRoutes } from '../modules/designations/designations.routes';
import { notificationsRoutes } from '../modules/notifications/notifications.routes';
import { categoriesRoutes, categoriesPublicRoutes } from '../modules/categories/categories.routes';
import { servicesRoutes, servicesPublicRoutes } from '../modules/services/services.routes';

import leadsRoutes from '../modules/leads/leads.routes';
import { bookingsRoutes } from '../modules/bookings/bookings.routes';

export const rootRouter = Router();

// Routes are registered under /api/v1. Add new modules here; don't replace the list.
rootRouter.use('/auth', authRoutes);
rootRouter.use('/admin/dashboard', adminDashboardRoutes); // GET /admin/dashboard/summary, /trends
rootRouter.use('/admin/settings', settingsRoutes); // GET /admin/settings, PUT /admin/settings/:key
rootRouter.use('/admin/designations', designationsRoutes); // GET, POST, PATCH /:id, DELETE /:id
rootRouter.use('/admin/categories', categoriesRoutes); // GET, POST, PATCH /:id, DELETE /:id
rootRouter.use('/admin/services', servicesRoutes); // GET, GET /:id, POST, PATCH /:id, DELETE /:id
rootRouter.use('/categories', categoriesPublicRoutes); // GET /categories (active only)
rootRouter.use('/services', servicesPublicRoutes); // GET /services?category=&q=, GET /services/:idOrSlug
rootRouter.use('/notifications', notificationsRoutes); // GET /notifications, PATCH /:id/read, PATCH /read-all
rootRouter.use('/admin', auditRoutes); // GET /admin/audit-logs
rootRouter.use('/admin/partners', partnersRoutes); // GET /admin/partners, GET /admin/partners/stats, POST /admin/partners
rootRouter.use('/partner/dashboard', partnerDashboardRoutes);
rootRouter.use('/partner/availability', availabilityRoutes);
rootRouter.use('/partner/blackout-dates', blackoutRoutes); // GET, POST, PATCH, DELETE /partner/blackout-dates
rootRouter.use('/partner/schedule', scheduleRoutes); // GET /partner/schedule
rootRouter.use(leadsRoutes); // POST /public/leads
rootRouter.use(bookingsRoutes); // GET /services/:id/slots, POST /bookings, GET /bookings/:id

export default rootRouter;