import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { getSchedule } from './schedule.controller';

export const scheduleRoutes = Router();

scheduleRoutes.use(authenticate, requireRole('partner'));
scheduleRoutes.get('/', getSchedule);

export default scheduleRoutes;