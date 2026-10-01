import { Router } from 'express';
import { authenticate, getAuthUser } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/role.middleware';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { settingsService } from './settings.service';

/** Mounted at /api/v1/admin/settings. Admin only. */
export const settingsRoutes = Router();
settingsRoutes.use(authenticate, requireAdmin);

settingsRoutes.get('/', asyncHandler(async (_req, res) => sendSuccess(res, await settingsService.list())));

settingsRoutes.put(
  '/:key',
  asyncHandler(async (req, res) => {
    const { id } = getAuthUser(req);
    sendSuccess(res, await settingsService.update(req.params.key, req.body?.value, id));
  }),
);

export default settingsRoutes;
