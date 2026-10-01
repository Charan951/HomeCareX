import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { designationsService } from './designations.service';

/** Mounted at /api/v1/admin/designations. Admin only. */
export const designationsRoutes = Router();
designationsRoutes.use(authenticate, requireAdmin);

designationsRoutes.get('/', asyncHandler(async (_req, res) => sendSuccess(res, await designationsService.list())));
designationsRoutes.post('/', asyncHandler(async (req, res) => sendSuccess(res, await designationsService.create(req.body), { status: 201 })));
designationsRoutes.patch('/:id', asyncHandler(async (req, res) => sendSuccess(res, await designationsService.rename(req.params.id, req.body))));
designationsRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await designationsService.remove(req.params.id);
    sendSuccess(res, { ok: true });
  }),
);

export default designationsRoutes;
