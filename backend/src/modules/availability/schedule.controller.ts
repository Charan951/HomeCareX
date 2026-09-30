import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as service from './schedule.service';
import { getScheduleQuerySchema } from './schedule.validation';

export const getSchedule = async (req: Request, res: Response) => {
  try {
    const { from, to } = getScheduleQuerySchema.parse(req.query);
    const partnerId = res.locals.auth.sub as string;
    res.json({ data: await service.getSchedule(partnerId, from, to) });
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ message: 'Validation failed', errors: err.flatten() });
    }
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};