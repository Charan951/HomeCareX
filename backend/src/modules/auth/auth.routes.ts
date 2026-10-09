import { Router } from 'express';
import { authController } from './auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authRateLimit } from '../../middleware/rateLimit.middleware';

export const authRoutes = Router();

authRoutes.post('/login', authRateLimit, authController.login);
authRoutes.post('/register', authRateLimit, authController.register);
authRoutes.post('/refresh', authController.refresh);
authRoutes.post('/logout', authController.logout);
authRoutes.post('/forgot-password', authRateLimit, authController.forgotPassword);
authRoutes.post('/verify-otp', authRateLimit, authController.verifyOtp);
authRoutes.post('/resend-otp', authRateLimit, authController.resendOtp);
authRoutes.post('/reset-password', authRateLimit, authController.resetPassword);
authRoutes.get('/me', authMiddleware, authController.me);

export default authRoutes;