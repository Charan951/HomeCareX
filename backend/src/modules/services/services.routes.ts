import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { servicesService } from './services.service';

/** Admin, mounted at /api/v1/admin/services. */
export const servicesRoutes = Router();
servicesRoutes.use(authenticate, requireAdmin);
servicesRoutes.get('/', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.list(req.query))));
servicesRoutes.get('/:id', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.get(req.params.id))));
servicesRoutes.post('/', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.create(req.body), { status: 201 })));
servicesRoutes.patch('/:id', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.update(req.params.id, req.body))));
servicesRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await servicesService.remove(req.params.id);
    sendSuccess(res, { ok: true });
  }),
);

export default servicesRoutes;
