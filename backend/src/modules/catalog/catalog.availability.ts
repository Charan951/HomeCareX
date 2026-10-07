import { BookingService } from '../bookings/bookings.service';
import { addDays, nowInBookingTz } from '../bookings/bookings.time';
import type { SlotAvailabilityDto } from './catalog.types';

/** The details page asks "is there a slot in the next 7 days?" (today + 6). */
export const AVAILABILITY_WINDOW_DAYS = 7;

/**
 * The one seam to the slot service (bookings module, GET /services/:id/slots). It returns a single
 * day's slots, so this module only ever calls that contract and never reads bookings itself.
 * Tests replace `getDaySlots`.
 */
export const slotSource = {
  getDaySlots: (serviceId: string, date: string) => BookingService.getAvailableSlots(serviceId, date),
};

/**
 * Walks the window one day at a time and stops at the first day with a free slot, so the common case
 * (slots today or tomorrow) costs one slot lookup instead of seven. If the slot service fails the page
 * still loads: `hasSlots` is null ("couldn't check"), never a false "no slots".
 */
export async function summarizeAvailability(serviceId: string, today: string = nowInBookingTz().date): Promise<SlotAvailabilityDto> {
  try {
    for (let offset = 0; offset < AVAILABILITY_WINDOW_DAYS; offset += 1) {
      const date = addDays(today, offset);
      const day = await slotSource.getDaySlots(serviceId, date);
      if (day.slots.some((s) => s.available)) {
        return { windowDays: AVAILABILITY_WINDOW_DAYS, hasSlots: true, nextAvailableDate: date };
      }
    }
    return { windowDays: AVAILABILITY_WINDOW_DAYS, hasSlots: false, nextAvailableDate: null };
  } catch (err) {
    console.error(`Slot availability lookup failed for service ${serviceId}:`, err);
    return { windowDays: AVAILABILITY_WINDOW_DAYS, hasSlots: null, nextAvailableDate: null };
  }
}
