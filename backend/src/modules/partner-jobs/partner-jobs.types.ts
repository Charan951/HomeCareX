import type { BookingStatus } from '../bookings/bookings.constants';

/** Statuses a partner may set through PATCH /bookings/:id/status. Start (in_progress) needs the OTP flow. */
export const PARTNER_STATUS_TARGETS = ['en_route', 'arrived'] as const;
export type PartnerStatusTarget = (typeof PARTNER_STATUS_TARGETS)[number];

export interface JobActionDto {
  status: PartnerStatusTarget;
  label: string;
}

export interface JobChecklistItemDto {
  id: string;
  label: string;
  done: boolean;
}

export interface JobAddOnDto {
  name: string;
  quantity: number;
  amount: number;
}

export interface JobHistoryDto {
  from: BookingStatus | null;
  to: BookingStatus;
  at: string;
  actorRole: string;
  actorId: string | null;
  reason: string | null;
}

/** GET /partner/jobs/:id. Never contains OTP codes, payment ids/signatures or the full customer phone. */
export interface JobDetailDto {
  id: string;
  status: BookingStatus;
  customer: { name: string; phone: string | null };
  service: { name: string; quantity: number; durationMinutes: number | null };
  location: {
    line1: string;
    area: string | null;
    city: string;
    pincode: string | null;
    coordinates: { lat: number; lng: number } | null;
  };
  schedule: { scheduledAt: string; date: string | null; slot: string | null; startedAt: string | null };
  price: { currency: string; total: number; partnerEarning: number };
  addOns: JobAddOnDto[];
  instructions: string | null;
  checklist: JobChecklistItemDto[];
  payment: { status: string; paidAt: string | null };
  actions: JobActionDto[];
  /** true once the partner has arrived: the next step is OTP verification, not a status button. */
  otpRequired: boolean;
  statusHistory: JobHistoryDto[];
}