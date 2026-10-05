import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { servicesService } from './services.service';

/** Public, mounted at /api/v1/services: GET /?category=<id|slug>&q=, GET /:idOrSlug. */
export const servicesPublicRoutes = Router();
servicesPublicRoutes.get('/', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.list(req.query))));
servicesPublicRoutes.get('/:idOrSlug', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.get(req.params.idOrSlug))));

/** Admin, mounted at /api/v1/admin/services. */
export const servicesRoutes = Router();
servicesRoutes.use(authenticate, requireAdmin);
servicesRoutes.get('/', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.list(req.query, { admin: true }))));
servicesRoutes.get('/:id', asyncHandler(async (req, res) => sendSuccess(res, await servicesService.get(req.params.id, { admin: true }))));
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
