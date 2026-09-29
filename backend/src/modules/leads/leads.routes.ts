import { Router } from 'express';

import { rateLimitMiddleware } from '../../middleware/rateLimit.middleware';
import { LeadsController } from './leads.controller';

export const leadsRoutes = Router();
const controller = new LeadsController();

leadsRoutes.post('/public/leads', rateLimitMiddleware, controller.createLead);

export default leadsRoutes;
