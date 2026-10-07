import type { Request, Response } from 'express';
import { couponsService } from './coupons.service';
import { sendSuccess } from '../../utils/response';

export class CouponsController {
  async list(req: Request, res: Response) {
    const search =
      typeof req.query.search === 'string'
        ? req.query.search
        : undefined;

    let active: boolean | undefined;

    if (req.query.active === 'true') {
      active = true;
    } else if (req.query.active === 'false') {
      active = false;
    }

    const coupons = await couponsService.list(
      search,
      active,
    );

    return sendSuccess(res, coupons);
  }

  async getById(req: Request, res: Response) {
    const coupon = await couponsService.getById(
      req.params.id,
    );

    return sendSuccess(res, coupon);
  }

  async create(req: Request, res: Response) {
    const coupon = await couponsService.create(
      req.body,
    );

    return sendSuccess(res, coupon, {
      status: 201,
    });
  }

  async update(req: Request, res: Response) {
    const coupon = await couponsService.update(
      req.params.id,
      req.body,
    );

    return sendSuccess(res, coupon);
  }

  async remove(req: Request, res: Response) {
    await couponsService.remove(req.params.id);

    return sendSuccess(res, {
      ok: true,
    });
  }

  async validate(req: Request, res: Response) {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const result = await couponsService.validate(
      req.body,
      user.id,
    );

    return sendSuccess(res, result);
  }

  async listAvailable(
    req: Request,
    res: Response,
  ) {
    const user = req.user;

    if (!user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const coupons =
      await couponsService.listAvailable(
        req.body,
        user.id,
      );

    return sendSuccess(res, coupons);
  }
}

export const couponsController =
  new CouponsController();
