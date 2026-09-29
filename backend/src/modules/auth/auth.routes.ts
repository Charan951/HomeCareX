import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimit } from '../../middleware/rateLimit.middleware';

export const authRoutes = Router();

authRoutes.post('/login', authRateLimit, authController.login);
authRoutes.post('/register', authRateLimit, authController.register);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.get('/me', authenticate, authController.me);

export default authRoutes;
