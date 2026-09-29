import { Router } from 'express';
import { tempPartnerAuth } from './availability.tempAuth';
import { getAvailability, patchAvailability } from './availability.controller';

export const availabilityRoutes = Router();

availabilityRoutes.use(tempPartnerAuth);
availabilityRoutes.get('/', getAvailability);
availabilityRoutes.patch('/', patchAvailability);

export default availabilityRoutes;

