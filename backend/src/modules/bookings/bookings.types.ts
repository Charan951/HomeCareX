import type { Types } from 'mongoose';
import type { ActorRole, BookingStatus } from './bookings.constants';

export interface AddOnInput { addOnId: string; quantity: number }

export interface AddressSnapshot {
  label?: string;
  contactName?: string;
  contactPhone?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  location: { lat: number; lng: number };
  sourceAddressId?: string;
}

export interface PriceLine {
  kind: 'BASE' | 'ADDON';
  refId: Types.ObjectId | string;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export interface PriceSnapshot {
  currency: 'INR';
  lines: PriceLine[];
  addOnsTotal: number;
  surge: number;
  surgeLabel?: string;
  /** base + add-ons + surge */
  subtotal: number;
  discount: number;
  couponCode?: string;
  convenienceFee: number;
  gst: number;
  total: number;
  computedAt: Date;
}

export interface HistoryEntry {
  from: BookingStatus | null;
  to: BookingStatus;
  at: Date;
  actorId?: Types.ObjectId | string;
  actorRole: ActorRole;
  note?: string;
}

/** Request body for POST /bookings. `newAddress` is accepted for parity with Step 2's "add new
 *  address" flow; either `addressId` or `newAddress` must be present (enforced in validation). */
export interface CreateBookingInput {
  serviceId: string;
  quantity: number;
  addOns: AddOnInput[];
  addressId?: string;
  newAddress?: Omit<AddressSnapshot, 'sourceAddressId'>;
  date: string;
  slot: string;
  couponCode?: string;
  /** Client's last-seen total (from the running estimate). Server recomputes and 409s on drift
   *  past `PRICE_CHANGED_TOLERANCE` rather than trusting it. */
  expectedTotal?: number;
}