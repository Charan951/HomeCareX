import type { Request, Response } from 'express';
import { addressesService } from './addresses.service';

export const addressesController = {
  async serviceability(req: Request, res: Response): Promise<void> {
    const pincode = req.query.pincode as string;
    const result = addressesService.checkServiceability(pincode);
    res.json({ success: true, data: result });
  },

  async list(req: Request, res: Response) {
    const customerId = res.locals.auth.sub;
    const addresses = await addressesService.list(customerId);
    res.json({ success: true, data: { addresses } });
  },

  async create(req: Request, res: Response) {
    const customerId = res.locals.auth.sub;
    const address = await addressesService.create(customerId, req.body);
    res.status(201).json({ success: true, data: { address } });
  },

  async update(req: Request, res: Response) {
    const customerId = res.locals.auth.sub;
    const addressId = req.params.id;
    const address = await addressesService.update(customerId, addressId, req.body);
    res.json({ success: true, data: { address } });
  },

  async remove(req: Request, res: Response) {
    const customerId = res.locals.auth.sub;
    const addressId = req.params.id;
    await addressesService.remove(customerId, addressId);
    res.json({ success: true, data: null });
  },
};