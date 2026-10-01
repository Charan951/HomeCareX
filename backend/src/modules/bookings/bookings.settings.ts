import { SLOT_CAPACITY } from './bookings.constants';

/**
 * Booking-related Settings. There is no Settings collection in the backend yet (the admin
 * Settings page is UI-only), so capacity is read from the SLOT_CAPACITY env var with a constant
 * fallback. When Settings ships, change only the body of getSlotCapacity() — callers already
 * await it and pass the serviceId for per-service overrides.
 */
export const bookingSettings = {
  async getSlotCapacity(_serviceId: string): Promise<number> {
    const fromEnv = Number.parseInt(process.env.SLOT_CAPACITY ?? '', 10);
    return Number.isInteger(fromEnv) && fromEnv > 0 ? fromEnv : SLOT_CAPACITY;
  },

  /**
   * Whether a booking must be paid before it is CONFIRMED.
   * false (default, until the Payments module is wired to Step 4): the booking is CONFIRMED on submit.
   * true: it is created PENDING_PAYMENT and holds its seat for BOOKING_HOLD_MS.
   */
  async isPaymentRequired(): Promise<boolean> {
    return process.env.BOOKING_REQUIRE_PAYMENT === 'true';
  },
};