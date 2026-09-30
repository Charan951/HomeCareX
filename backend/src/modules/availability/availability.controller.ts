import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as service from './availability.service';
import { updateAvailabilitySchema } from './availability.validation';

const handleError = (err: unknown, res: Response) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ message: 'Validation failed', errors: err.flatten() });
  }
  if (err instanceof service.AvailabilityError) {
    return res.status(err.status).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
};

export const getAvailability = async (_req: Request, res: Response) => {
  try {
    const partnerId = res.locals.auth.sub as string;
    const data = await service.getAvailability(partnerId);
    res.json({ data });
  } catch (err) {
    handleError(err, res);
  }
};

export const patchAvailability = async (req: Request, res: Response) => {
  try {
    const input = updateAvailabilitySchema.parse(req.body);
    const partnerId = res.locals.auth.sub as string;
    const data = await service.updateAvailability(partnerId, input);
    res.json({ data });
  } catch (err) {
    handleError(err, res);
  }
};