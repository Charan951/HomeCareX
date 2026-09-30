import type { NextFunction, Request, Response } from 'express';
import { ReviewsService } from './reviews.service';

export class ReviewsController {
  constructor(private readonly reviewsService = new ReviewsService()) {}

  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const review = await this.reviewsService.createReview(res.locals.auth.sub, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  };

  listCustomerReviews = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.reviewsService.listCustomerReviews(res.locals.auth.sub) });
    } catch (error) {
      next(error);
    }
  };

  listAdminReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.reviewsService.listAdminReviews(req.query) });
    } catch (error) {
      next(error);
    }
  };

  updateReviewStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.json({ success: true, data: await this.reviewsService.updateReviewStatus(req.params.id, req.body?.status) });
    } catch (error) {
      next(error);
    }
  };
}
