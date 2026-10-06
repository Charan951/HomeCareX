import { Router } from 'express';
import paymentRoutes from '../modules/payments/payments.routes';
import walletRoutes from '../modules/wallet/wallet.routes';
import { authRoutes } from '../modules/auth/auth.routes';
import { auditRoutes } from '../modules/audit/audit.routes';
import { adminRoutes } from '../modules/admin/admin.routes';
import { partnersRoutes } from '../modules/partners/partners.routes';
import { availabilityRoutes } from '../modules/availability/availability.routes';
import { blackoutRoutes } from '../modules/availability/blackout.routes';
import { scheduleRoutes } from '../modules/availability/schedule.routes';
import { partnerDashboardRoutes } from '../modules/partners/partner-dashboard.routes';
import { earningsRoutes } from '../modules/earnings/earnings.routes';
import { adminDashboardRoutes } from '../modules/admin-dashboard/admin-dashboard.routes';
import { settingsRoutes } from '../modules/settings/settings.routes';
import { designationsRoutes } from '../modules/designations/designations.routes';
import { notificationsRoutes } from '../modules/notifications/notifications.routes';
import { categoriesRoutes } from '../modules/categories/categories.routes';
import { servicesRoutes } from '../modules/services/services.routes';
import { catalogRoutes } from '../modules/catalog/catalog.routes';
import { incentivesRoutes } from '../modules/incentives/incentives.routes';
import { adminCustomersRoutes } from '../modules/admin-customers/admin-customers.routes';

import leadsRoutes from '../modules/leads/leads.routes';

import { bookingsRoutes } from '../modules/bookings/bookings.routes';
import customerDashboardRoutes from '../modules/customer-dashboard/customer-dashboard.routes';
import { addressesRoutes } from '../modules/addresses/addresses.routes';
import { reviewsRoutes } from '../modules/reviews/reviews.routes';

export const rootRouter = Router();

// Routes are registered under /api/v1. Add new modules here; don't replace the list.

rootRouter.use('/auth', authRoutes);
rootRouter.use('/admin/dashboard', adminDashboardRoutes); // GET /admin/dashboard/summary, /trends
rootRouter.use('/admin/settings', settingsRoutes); // GET /admin/settings, PUT /admin/settings/:key
rootRouter.use('/admin/designations', designationsRoutes); // GET, POST, PATCH /:id, DELETE /:id
rootRouter.use('/admin/categories', categoriesRoutes); // GET, POST, PATCH /:id, DELETE /:id
rootRouter.use('/admin/services', servicesRoutes); // GET, GET /:id, POST, PATCH /:id, DELETE /:id
rootRouter.use(catalogRoutes); // PUBLIC: GET /categories, GET /services?q&category&rating&minPrice&maxPrice&duration&availability&sort&page&limit, GET /services/:idOrSlug
rootRouter.use('/notifications', notificationsRoutes); // GET /notifications, PATCH /:id/read, PATCH /read-all
rootRouter.use('/admin', auditRoutes); // GET /admin/audit-logs

rootRouter.use('/admin', adminRoutes); // GET /admin/bookings

rootRouter.use('/admin/partners', partnersRoutes); // GET /admin/partners, GET /admin/partners/stats, POST /admin/partners

rootRouter.use('/partner/dashboard', partnerDashboardRoutes);
rootRouter.use('/customer/dashboard', customerDashboardRoutes); // GET /customer/dashboard
rootRouter.use('/partner/availability', availabilityRoutes);

rootRouter.use('/partner/blackout-dates', blackoutRoutes); // GET, POST, PATCH, DELETE /partner/blackout-dates

rootRouter.use('/partner/schedule', scheduleRoutes); // GET /partner/schedule

rootRouter.use(leadsRoutes); // POST /public/leads

rootRouter.use(bookingsRoutes); // GET /services/:id/slots, POST /bookings/check-slot, POST /bookings, GET /bookings/:id
rootRouter.use('/partner/earnings', earningsRoutes); // GET /partner/earnings/summary
rootRouter.use('/addresses', addressesRoutes); // GET/POST /addresses, GET /addresses/serviceability
rootRouter.use('/payments', paymentRoutes); // GET /payments, POST /payments/order, /cod, /verify, /attempt, /webhook (public, HMAC)
rootRouter.use('/wallet', walletRoutes); // GET /wallet
rootRouter.use(reviewsRoutes); // POST /reviews, GET /reviews/mine, GET /admin/reviews, PATCH /admin/reviews/:id/status
rootRouter.use('/partner/incentives', incentivesRoutes); // GET /partner/incentives, GET /partner/incentives/:id
rootRouter.use('/admin/customers', adminCustomersRoutes);
export default rootRouter;