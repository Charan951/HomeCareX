import type { Request, Response } from 'express';
import { pricingService } from './pricing.service';
import type { QuoteInput } from './pricing.types';

export const pricingController = {
  async quote(req: Request, res: Response) {
    const quote = await pricingService.quote(req.body as QuoteInput);
    res.json({ success: true, data: quote });
  },
};

export class PricingController {}