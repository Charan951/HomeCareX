import { Request, Response } from 'express';
import { BookingService } from './bookings.service';
import type { CreateBookingInput } from './bookings.types';

export const bookingsController = {
  async getSlots(req: Request, res: Response) {
    const serviceId = req.params.id;
    const date = req.query.date as string;
    const result = await BookingService.getAvailableSlots(serviceId, date);
    res.json({ success: true, data: result });
  },

  async createBooking(req: Request, res: Response) {
    const customerId = (req as any).user.id || (req as any).user._id;
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
    const customerId = (req as any).user.id || (req as any).user._id;
    const booking = await BookingService.getBooking(customerId, req.params.id);
    res.json({ success: true, data: booking });
  },

  async listBookings(req: Request, res: Response) {
    const customerId = (req as any).user.id || (req as any).user._id;
    const bookings = await BookingService.listBookings(customerId);
    res.json({ success: true, count: bookings.length, data: bookings });
  },
};