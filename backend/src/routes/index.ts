import { Router } from 'express';

import leadsRoutes from '../modules/leads/leads.routes';

export const rootRouter = Router();

rootRouter.use(leadsRoutes);

export default rootRouter;
