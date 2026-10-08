import type {
  Request,
  Response,
} from 'express';

import { sendSuccess } from '../../utils/response';
import {
  marketingService,
} from './marketing.service';

export class MarketingController {
  async listAdmin(
    _req: Request,
    res: Response,
  ) {
    const banners =
      await marketingService.listAdmin();

    return sendSuccess(res, banners);
  }

  async getById(
    req: Request,
    res: Response,
  ) {
    const banner =
      await marketingService.getById(
        req.params.id,
      );

    return sendSuccess(res, banner);
  }

  async create(
    req: Request,
    res: Response,
  ) {
    const banner =
      await marketingService.create(
        req.body,
      );

    return sendSuccess(res, banner, {
      status: 201,
    });
  }

  async update(
    req: Request,
    res: Response,
  ) {
    const banner =
      await marketingService.update(
        req.params.id,
        req.body,
      );

    return sendSuccess(res, banner);
  }

  async remove(
    req: Request,
    res: Response,
  ) {
    await marketingService.remove(
      req.params.id,
    );

    return sendSuccess(res, {
      ok: true,
    });
  }

  async listPublic(
    req: Request,
    res: Response,
  ) {
    const placement =
      typeof req.query.placement === 'string'
        ? req.query.placement
        : undefined;

    const banners =
      await marketingService.listPublic(
        placement,
      );

    return sendSuccess(res, banners);
  }
}

export const marketingController =
  new MarketingController();
