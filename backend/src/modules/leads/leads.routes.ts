import { Router } from 'express';

import { rateLimit } from '../../middleware/rateLimit.middleware';
import { LeadsController } from './leads.controller';

export const leadsRoutes = Router();
const controller = new LeadsController();

// Spec NT-01: 5 requests per minute per IP.
leadsRoutes.post('/public/leads', rateLimit({ windowMs: 60_000, max: 5 }), controller.createLead);

export default leadsRoutes;
