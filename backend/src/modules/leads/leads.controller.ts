import type { NextFunction, Request, Response } from 'express';

import { HttpError } from '../auth/auth.types';
import { LeadsService } from './leads.service';

export class LeadsController {
  constructor(private readonly leadsService = new LeadsService()) {}

  createLead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.leadsService.createLead(req.body);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof HttpError) {
        next(error);
        return;
      }
      const message = error instanceof Error ? error.message : 'Invalid lead data';

      if (message.toLowerCase().includes('too many requests') || message === 'Too many requests') {
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
        });
        return;
      }

      if (message.includes('at least 20 characters') || message.includes('valid email') || message.includes('Gmail address') || message.includes('valid Indian mobile number') || message.includes('required')) {
        res.status(400).json({
          success: false,
          message: 'Please check the highlighted fields.',
        });
        return;
      }

      if (message.includes('source')) {
        res.status(400).json({
          success: false,
          message: 'Please check the highlighted fields.',
        });
        return;
      }

      res.status(500).json({
        success: false,
        message: 'Something went wrong on our side. Please try again.',
      });
    }
  };
}
