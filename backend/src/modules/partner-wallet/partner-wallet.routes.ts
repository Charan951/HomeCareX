import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validation.middleware';
import { getTransactions, getWalletSummary } from './partner-wallet.controller';
import { transactionsQuerySchema } from './partner-wallet.validation';

export const partnerWalletRoutes = Router();

// GET /api/v1/partner/transactions  ?type&from&to&page&limit
// (role: partner, permission: partner:wallet:read)
partnerWalletRoutes.get(
  '/',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:wallet:read'),
  validate(transactionsQuerySchema, 'query'),
  getTransactions,
);

export const partnerWalletSummaryRoutes = Router();

// GET /api/v1/partner/wallet   (role: partner, permission: partner:wallet:read)
partnerWalletSummaryRoutes.get(
  '/',
  authenticate,
  requireRole('partner'),
  requirePermission('partner:wallet:read'),
  getWalletSummary,
);

export default partnerWalletRoutes;