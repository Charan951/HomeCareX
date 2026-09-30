import type { NextFunction, Request, Response } from 'express';
import { parseBody } from '../auth/auth.validation';
import { partnersService } from './partners.service';
import { createPartnerSchema } from './partners.validation';

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    fn(req, res).catch(next);
  };

export class PartnersController {
  create = wrap(async (req, res) => {
    const data = await partnersService.create(parseBody(createPartnerSchema, req.body));
    res.status(201).json({
      success: true,
      data,
      message: data.emailSent
        ? 'Partner registered and credentials emailed.'
        : 'Partner registered, but the email could not be sent.',
    });
  });

  getPartners = wrap(async (_req, res) => {
    res.json({ success: true, data: await partnersService.list() });
  });

  getStats = wrap(async (_req, res) => {
    res.json({ success: true, data: await partnersService.stats() });
  });
}

export default PartnersController;
