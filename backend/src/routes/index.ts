import { Router } from 'express';
import { bookingsRoutes } from '../modules/bookings/bookings.routes';

export const rootRouter = Router();

// Routes will be registered here under /api/v1
rootRouter.use(bookingsRoutes);

export default rootRouter;
