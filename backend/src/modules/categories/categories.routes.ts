import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { categoriesService } from './categories.service';

/** Admin, mounted at /api/v1/admin/categories. */
export const categoriesRoutes = Router();
categoriesRoutes.use(authenticate, requireAdmin);
categoriesRoutes.get('/', asyncHandler(async (_req, res) => sendSuccess(res, await categoriesService.list())));
categoriesRoutes.post('/', asyncHandler(async (req, res) => sendSuccess(res, await categoriesService.create(req.body), { status: 201 })));
categoriesRoutes.patch('/:id', asyncHandler(async (req, res) => sendSuccess(res, await categoriesService.update(req.params.id, req.body))));
categoriesRoutes.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await categoriesService.remove(req.params.id);
    sendSuccess(res, { ok: true });
  }),
);

export default categoriesRoutes;
