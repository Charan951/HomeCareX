import { AppError } from '../../utils/AppError';
import { ServiceModel } from '../../models/Service';
import { CONVENIENCE_FEE } from '../bookings/bookings.constants';
import { slotStartMinutes } from '../bookings/bookings.time';
import { GST_RATE, SURGE_FROM_MINUTES, SURGE_LABEL, SURGE_RATE } from './pricing.constants';
import type { PriceQuote, PricingBreakdown, QuoteInput, QuoteLine } from './pricing.types';

/**
 * The one place price maths lives. `lines` are the BASE line followed by the ADDON lines, already
 * resolved against the database. Used by quote() below and by BookingService.createBooking.
 */
export function calculatePricing({
  lines,
  slot,
  discount = 0,
}: {
  lines: { amount: number }[];
  slot: string;
  discount?: number;
}): PricingBreakdown {
  const baseAmount = lines[0]?.amount ?? 0;
  const addOnsTotal = lines.slice(1).reduce((sum, l) => sum + l.amount, 0);
  const hasSurge = slotStartMinutes(slot) >= SURGE_FROM_MINUTES;
  const surge = hasSurge ? Math.round((baseAmount + addOnsTotal) * SURGE_RATE) : 0;
  const subtotal = baseAmount + addOnsTotal + surge;
  const gst = Math.round((subtotal - discount + CONVENIENCE_FEE) * GST_RATE);
  return {
    addOnsTotal,
    surge,
    ...(hasSurge ? { surgeLabel: SURGE_LABEL } : {}),
    subtotal,
    discount,
    convenienceFee: CONVENIENCE_FEE,
    gst,
    total: subtotal - discount + CONVENIENCE_FEE + gst,
  };
}

export const pricingService = {
  /** POST /pricing/quote. Prices come from the database; the client only sends ids and quantities. */
  async quote(input: QuoteInput): Promise<PriceQuote> {
    const row = await ServiceModel.findOne({ _id: input.serviceId, active: { $ne: false } }, 'name basePrice addOns').lean();
    if (!row) throw new AppError(404, 'SERVICE_NOT_FOUND', 'That service was not found');

    if (new Set(input.addOns.map((a) => a.addOnId)).size !== input.addOns.length) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Each add-on can only be listed once');
    }

    const lines: QuoteLine[] = [
      {
        kind: 'BASE',
        refId: String(row._id),
        name: row.name,
        unitPrice: row.basePrice,
        quantity: input.quantity,
        amount: row.basePrice * input.quantity,
      },
    ];
    for (const a of input.addOns) {
      const addOn = (row.addOns ?? []).find((x) => String(x._id) === a.addOnId);
      if (!addOn) {
        throw new AppError(422, 'ADDON_NOT_FOUND', 'One of the selected add-ons is not available for this service', {
          addOnId: a.addOnId,
        });
      }
      lines.push({
        kind: 'ADDON',
        refId: String(addOn._id),
        name: addOn.name,
        unitPrice: addOn.price,
        quantity: a.quantity,
        amount: addOn.price * a.quantity,
      });
    }

    return {
      currency: 'INR',
      lines,
      ...calculatePricing({ lines, slot: input.slot }),
      coupon: null,
      // Coupons are not live yet (POST /bookings rejects them too), so a code in the request is dropped.
      ...(input.couponCode ? { couponError: { code: 'COUPON_INVALID' } } : {}),
      computedAt: new Date().toISOString(),
    };
  },
};

export class PricingService {}