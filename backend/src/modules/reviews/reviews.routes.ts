import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin, requireRole } from '../../middleware/role.middleware';
import { ReviewsController } from './reviews.controller';

export const reviewsRoutes = Router();
const controller = new ReviewsController();

// Public, no auth: visible reviews + star distribution for the service details page.
reviewsRoutes.get('/services/:id/reviews', controller.listServiceReviews);
reviewsRoutes.post('/reviews', authenticate, requireRole('customer'), controller.createReview);
reviewsRoutes.get('/reviews/mine', authenticate, requireRole('customer'), controller.listCustomerReviews);
reviewsRoutes.get('/admin/reviews', authenticate, requireAdmin, controller.listAdminReviews);
reviewsRoutes.patch('/admin/reviews/:id/status', authenticate, requireAdmin, controller.updateReviewStatus);

export default reviewsRoutes;
