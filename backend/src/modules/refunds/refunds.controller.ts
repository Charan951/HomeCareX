import type { Request, Response } from 'express';

import { getAuthUser } from '../../middleware/auth.middleware';
import { refundsService } from './refunds.service';

function getIp(req: Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

export class RefundsController {
  async create(req: Request, res: Response) {
    const admin = getAuthUser(req);

    const refund = await refundsService.createRefund({
      paymentId: String(req.body.paymentId ?? ''),
      amount: Number(req.body.amount),
      reason: String(req.body.reason ?? ''),
      method: req.body.method,
      adminId: admin.id,
      ip: getIp(req),
    });

    res.status(201).json({
      success: true,
      data: refund,
    });
  }

  async list(req: Request, res: Response) {
    const result = await refundsService.listRefunds({
      status:
        typeof req.query.status === 'string'
          ? req.query.status as
              | 'requested'
              | 'approved'
              | 'processed'
              | 'rejected'
          : undefined,

      paymentId:
        typeof req.query.paymentId === 'string'
          ? req.query.paymentId
          : undefined,

      bookingId:
        typeof req.query.bookingId === 'string'
          ? req.query.bookingId
          : undefined,

      customerId:
        typeof req.query.customerId === 'string'
          ? req.query.customerId
          : undefined,

      search:
        typeof req.query.search === 'string'
          ? req.query.search
          : undefined,

      page:
        typeof req.query.page === 'string'
          ? Number(req.query.page)
          : undefined,

      limit:
        typeof req.query.limit === 'string'
          ? Number(req.query.limit)
          : undefined,
    });

    res.status(200).json({
      success: true,
      data: result.items,
      meta: result.pagination,
    });
  }

  async update(req: Request, res: Response) {
    const admin = getAuthUser(req);

    const refund = await refundsService.updateRefund({
      refundId: req.params.id,
      action: req.body.action,
      rejectionReason:
        typeof req.body.rejectionReason === 'string'
          ? req.body.rejectionReason
          : undefined,
      adminId: admin.id,
      ip: getIp(req),
    });

    res.status(200).json({
      success: true,
      data: refund,
    });
  }
}

export const refundsController = new RefundsController();