import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import * as controller from './blackout.controller';

export const blackoutRoutes = Router();

blackoutRoutes.use(authenticate, requireRole('partner'));
blackoutRoutes.get('/', controller.listBlackouts);
blackoutRoutes.post('/', controller.createBlackout);
blackoutRoutes.patch('/:id', controller.updateBlackout);
blackoutRoutes.delete('/:id', controller.deleteBlackout);

export default blackoutRoutes;