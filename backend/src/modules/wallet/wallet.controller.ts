import type { Request, Response } from 'express';
import { getAuthUser } from '../../middleware/auth.middleware';
import { walletService } from './wallet.service';
import type { WalletQuery } from './wallet.validation';

/** GET /wallet: balance + ledger for the signed-in customer only (the id comes from the token, never the URL). */
export const getWallet = async (req: Request, res: Response): Promise<void> => {
  const { id } = getAuthUser(req);
  const { page, limit, type } = req.query as unknown as WalletQuery;
  res.json({ success: true, data: await walletService.getWallet(id, page, limit, type) });
};
