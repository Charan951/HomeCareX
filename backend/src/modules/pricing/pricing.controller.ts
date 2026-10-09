import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { pricingAdminService } from './pricing.admin.service';
import { pricingService } from './pricing.service';
import type { QuoteInput } from './pricing.types';
import type { GetPricingQuery, PutPricingBody } from './pricing.validation';

export const pricingController = {
  async quote(req: Request, res: Response) {
    const quote = await pricingService.quote(req.body as QuoteInput);
    res.json({ success: true, data: quote });
  },

  /** GET /admin/pricing */
  async adminList(req: Request, res: Response) {
    sendSuccess(res, await pricingAdminService.list(req.query as unknown as GetPricingQuery));
  },

  /** DELETE /admin/pricing/:id */
  async adminRemove(req: Request, res: Response) {
    const admin = getAuthUser(req);
    const out = await pricingAdminService.remove(String(req.params.id), { id: admin.id, ip: req.ip ?? 'unknown' });
    sendSuccess(res, out, { message: 'Pricing rule deleted' });
  },

  /** PUT /admin/pricing */
  async adminSave(req: Request, res: Response) {
    const admin = getAuthUser(req);
    const saved = await pricingAdminService.save(req.body as PutPricingBody, { id: admin.id, ip: req.ip ?? 'unknown' });
    sendSuccess(res, saved, { message: 'Pricing rule saved' });
  },
};

export class PricingController {}
