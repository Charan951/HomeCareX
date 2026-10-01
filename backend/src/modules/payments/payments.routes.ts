import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { createPaymentOrder, verifyPayment, recordPaymentAttempt } from './payments.controller';

const router = Router();

router.use(authMiddleware, roleMiddleware('customer'));

router.post('/create-order', asyncHandler(createPaymentOrder));
router.post('/verify', asyncHandler(verifyPayment));
router.post('/attempt', asyncHandler(recordPaymentAttempt)); // replaces /fail: never cancels the booking

export default router;