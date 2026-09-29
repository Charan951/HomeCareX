import { Router } from 'express';
import { availabilityRoutes } from '../modules/availability/availability.routes';

export const rootRouter = Router();

rootRouter.use('/partner/availability', availabilityRoutes);

export default rootRouter;