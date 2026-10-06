import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response';
import { catalogService } from './catalog.service';

export const catalogController = {
  categories: asyncHandler(async (req, res) => {
    sendSuccess(res, await catalogService.listCategories(req.query));
  }),

  /** data = the page of services, meta = { page, limit, total, totalPages }. */
  services: asyncHandler(async (req, res) => {
    const { items, meta } = await catalogService.searchServices(req.query);
    sendSuccess(res, items, { meta: { ...meta } });
  }),

  service: asyncHandler(async (req, res) => {
    sendSuccess(res, await catalogService.getService(req.params));
  }),
};
