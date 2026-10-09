import { Request, Response } from 'express';
import { BookingService } from './bookings.service';
import type { CreateBookingInput } from './bookings.types';
import type { ListBookingsQuery } from './bookings.query';
import { AppError } from '../../utils/AppError';

/** The signed-in user's id, taken from the verified token (never from the request body or query). */
function requireUserId(req: Request): string {
  const id = req.user?.id;
  if (!id) throw new AppError(401, 'UNAUTHENTICATED', 'Authentication token is missing');
  return id;
}

export const bookingsController = {
  async getSlots(req: Request, res: Response) {
    const serviceId = req.params.id;
    const date = req.query.date as string;
    const result = await BookingService.getAvailableSlots(serviceId, date);
    res.json({ success: true, data: result });
  },

  async checkSlot(req: Request, res: Response) {
    const serviceId = (req.params.id || req.body.serviceId || req.query.serviceId) as string;
    const date = (req.query.date || req.body.date) as string;
    const slot = (req.query.slot || req.body.slot) as string;
    const result = await BookingService.checkSlotAvailability(serviceId, date, slot);
    res.status(200).json({
      success: true,
      message: 'Slot is available',
      data: result,
    });
  },

  async createBooking(req: Request, res: Response) {
    const customerId = requireUserId(req);
    const idempotencyKey = req.header('Idempotency-Key');
    const result = await BookingService.createBooking(customerId, req.body as CreateBookingInput, idempotencyKey);
    res.status(result.replayed ? 200 : 201).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: result.booking,
      replayed: result.replayed,
    });
  },

  async getBooking(req: Request, res: Response) {
    const customerId = requireUserId(req);
    const booking = await BookingService.getBooking(customerId, req.params.id);
    res.json({ success: true, data: booking });
  },

  async listBookings(req: Request, res: Response) {
    // The customer is always the token's user. Nothing in the query string can widen this.
    const customerId = requireUserId(req);

    // validationMiddleware has already replaced req.query with the parsed, defaulted values.
    const query = req.query as unknown as ListBookingsQuery;
    const { items, meta } = await BookingService.listBookings(customerId, query);
    res.json({ success: true, count: items.length, data: items, meta });
  },
};