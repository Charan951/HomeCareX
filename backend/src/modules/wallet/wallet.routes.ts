import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { getWallet } from './wallet.controller';
import { walletQuerySchema } from './wallet.validation';

export const walletRoutes = Router();

walletRoutes.get('/', authMiddleware, roleMiddleware('customer'), validationMiddleware({ query: walletQuerySchema }), asyncHandler(getWallet));

export default walletRoutes;
