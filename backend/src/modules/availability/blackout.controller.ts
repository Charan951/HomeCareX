import { Request, Response } from 'express';
import { ZodError } from 'zod';
import * as service from './blackout.service';
import { createBlackoutSchema, updateBlackoutSchema } from './blackout.validation';

const partnerId = (res: Response) => res.locals.auth.sub as string;

const handleError = (err: unknown, res: Response) => {
  if (err instanceof ZodError) return res.status(400).json({ message: 'Validation failed', errors: err.flatten() });
  if (err instanceof service.BlackoutError) return res.status(err.status).json({ message: err.message });
  console.error(err);
  return res.status(500).json({ message: 'Something went wrong' });
};

export const listBlackouts = async (_req: Request, res: Response) => {
  try {
    res.json({ data: await service.listBlackouts(partnerId(res)) });
  } catch (err) { handleError(err, res); }
};

export const createBlackout = async (req: Request, res: Response) => {
  try {
    const input = createBlackoutSchema.parse(req.body);
    res.status(201).json({ data: await service.createBlackout(partnerId(res), input) });
  } catch (err) { handleError(err, res); }
};

export const updateBlackout = async (req: Request, res: Response) => {
  try {
    const input = updateBlackoutSchema.parse(req.body);
    res.json({ data: await service.updateBlackout(partnerId(res), req.params.id, input) });
  } catch (err) { handleError(err, res); }
};

export const deleteBlackout = async (req: Request, res: Response) => {
  try {
    await service.deleteBlackout(partnerId(res), req.params.id);
    res.status(204).send();
  } catch (err) { handleError(err, res); }
};