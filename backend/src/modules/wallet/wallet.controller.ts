import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/auth.middleware';
import { walletService } from './wallet.service';
import type { WalletQuery } from './wallet.validation';

export const getWallet = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const { page, limit, type } = req.query as unknown as WalletQuery;
  const data = await walletService.getWallet(id, Number(page), Number(limit), type);
  res.json({ success: true, data });
};

export const createTopupOrder = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const { amount } = req.body;
  const orderData = await walletService.createTopupOrder(id, Number(amount));
  res.json({ success: true, data: orderData });
};

export const verifyTopupPayment = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

  const result = await walletService.verifyTopupPayment({
    userId: id,
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
    amount: Number(amount),
  });

  res.json({
    success: true,
    message: 'Wallet credited successfully',
    data: result,
  });
};