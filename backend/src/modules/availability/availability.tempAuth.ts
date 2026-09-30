import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';

// TEMPORARY: replace with the real auth + role middleware when it exists.
export const tempPartnerAuth = (req: Request, res: Response, next: NextFunction) => {
  const id = req.header('x-partner-id');
  if (!id || !Types.ObjectId.isValid(id)) {
    return res.status(401).json({ message: 'Missing or invalid x-partner-id header' });
  }
  res.locals.partnerId = id;
  next();
};
