import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  createTopupOrder,
  verifyTopupPayment,
  recordFailedTopup,
} from './wallet.topup';
import { getWallet } from './wallet.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { walletQuerySchema } from './wallet.validation';

export const walletRoutes = Router();

// Every wallet route needs a signed-in customer. Applied at router level so a new
// route added below can never be exposed without authentication by accident.
// authMiddleware sets both req.user and res.locals.auth, so handlers using either work.
walletRoutes.use(authMiddleware, roleMiddleware('customer'));

walletRoutes.get(
  '/',
  validationMiddleware({ query: walletQuerySchema }),
  asyncHandler(getWallet)
);
walletRoutes.post('/topup/order', asyncHandler(createTopupOrder));
walletRoutes.post('/topup/verify', asyncHandler(verifyTopupPayment));
walletRoutes.post('/topup/fail', asyncHandler(recordFailedTopup));

export default walletRoutes;