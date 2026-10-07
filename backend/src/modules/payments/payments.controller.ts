import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/auth.middleware';
import { WEBHOOK_EVENT_ID_HEADER, WEBHOOK_SIGNATURE_HEADER } from './payments.constants';
import { paymentsService, processWebhook } from './payments.service';
import type { ListQuery } from './payments.validation';

/** POST /payments/order  { bookingId, method? }. `method: "cod"` takes the Cash on Service path. */
export const createPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const { bookingId, method } = req.body as { bookingId: string; method?: string };
  if (method === 'cod') {
    const result = await paymentsService.confirmCashOnService(id, bookingId);
    res.json({ success: true, replayed: result.replayed, data: result.booking });
    return;
  }
  const data = await paymentsService.createOrder(id, bookingId);
  res.json({ success: true, data });
};

/** POST /payments/cod  { bookingId } */
export const confirmCashOnService = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const result = await paymentsService.confirmCashOnService(id, (req.body as { bookingId: string }).bookingId);
  res.json({ success: true, replayed: result.replayed, data: result.booking });
};

/** POST /payments/verify */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const result = await paymentsService.verify(id, req.body as Parameters<typeof paymentsService.verify>[1]);
  res.json({ success: true, replayed: result.replayed, data: result.booking });
};

/** POST /payments/attempt */
export const recordPaymentAttempt = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  await paymentsService.recordAttempt(id, req.body as Parameters<typeof paymentsService.recordAttempt>[1]);
  res.json({ success: true });
};

/** GET /payments */
export const listPayments = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const data = await paymentsService.list(id, req.query as unknown as ListQuery);
  res.json({ success: true, data });
};

/** POST /payments/webhook (public; authenticated by the HMAC signature over the raw body). */
export const paymentWebhook = async (req: Request, res: Response): Promise<void> => {
  const result = await processWebhook({
    rawBody: req.rawBody ?? Buffer.alloc(0),
    signature: req.header(WEBHOOK_SIGNATURE_HEADER),
    eventId: req.header(WEBHOOK_EVENT_ID_HEADER),
    secret: process.env.RAZORPAY_WEBHOOK_SECRET,
  });
  res.status(200).json({ success: true, data: result });
};

