import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { getAvailability, patchAvailability } from './availability.controller';

export const availabilityRoutes = Router();

availabilityRoutes.use(authenticate, requireRole('partner'));
availabilityRoutes.get('/', getAvailability);
availabilityRoutes.patch('/', patchAvailability);

export default availabilityRoutes;