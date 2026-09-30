import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { PartnersController } from './partners.controller';

/** Mounted at /api/v1/admin/partners. Admin only. */
export const partnersRoutes = Router();

const controller = new PartnersController();

partnersRoutes.use(authenticate, requireAdmin);

partnersRoutes.get('/stats', controller.getStats); // GET  /admin/partners/stats -> { partners, customers }
partnersRoutes.get('/', controller.getPartners); //   GET  /admin/partners
partnersRoutes.post('/', controller.create); //       POST /admin/partners

export default partnersRoutes;
