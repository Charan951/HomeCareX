import type { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';
import { getAuthUser } from '../../middleware/auth.middleware';
import { bookingsService } from './bookings.service';
import type { CreateBookingInput } from './bookings.types';

export class BookingsController {
  async getSlots(req: Request, res: Response): Promise<void> {
    const { id: serviceId } = req.params as { id: string };
    const { date } = req.query as { date: string };
    const slots = await bookingsService.getSlotsForDate(serviceId, date);
    res.status(200).json({ success: true, data: { serviceId, date, slots } });
  }

  async createBooking(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
      throw new AppError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required');
    }

    const { booking, replayed } = await bookingsService.createBooking(user.id, idempotencyKey, req.body as CreateBookingInput);
    res.status(replayed ? 200 : 201).json({ success: true, data: { booking, replayed } });
  }

  async getBooking(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);
    const { id } = req.params as { id: string };
    const booking = await bookingsService.getBookingForCustomer(id, user.id);
    res.status(200).json({ success: true, data: { booking } });
  }
}

export const bookingsController = new BookingsController();
