import type { NextFunction, Request, Response } from 'express';
import { parseBody } from '../auth/auth.validation';
import { partnersService } from './partners.service';
import { createPartnerSchema, updatePartnerSchema } from './partners.validation';

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

  update = wrap(async (req, res) => {
    const data = await partnersService.update(req.params.id, parseBody(updatePartnerSchema, req.body));
    res.json({ success: true, data, message: 'Partner updated.' });
  });

  remove = wrap(async (req, res) => {
    await partnersService.remove(req.params.id);
    res.json({ success: true, data: { ok: true }, message: 'Partner removed.' });
  });

  getPartners = wrap(async (_req, res) => {
    res.json({ success: true, data: await partnersService.list() });
  });

  getStats = wrap(async (_req, res) => {
    res.json({ success: true, data: await partnersService.stats() });
  });
}

export default PartnersController;
