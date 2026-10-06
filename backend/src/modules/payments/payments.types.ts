import type { PaymentStatus } from '../../models/Payment';

/** Razorpay payment entity: only the fields this module reads. */
export interface RazorpayPaymentEntity {
  id: string;
  order_id?: string;
  amount: number; // paise
  currency: string;
  status: string;
  method?: string;
  error_description?: string;
}

export interface WebhookPayload {
  event: string;
  payload?: {
    payment?: { entity?: RazorpayPaymentEntity };
    order?: { entity?: { id: string } };
  };
}

export type WebhookResult =
  | { outcome: 'processed'; bookingConfirmed: boolean }
  | { outcome: 'replayed' }
  | { outcome: 'ignored' };

export interface PaymentListItem {
  id: string;
  bookingId: string;
  bookingRef: string;
  serviceName: string;
  bookingDate: string | null;
  amount: number;
  currency: string;
  method: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  createdAt: string;
  receiptNo: string | null;
}

export interface PaymentListResult {
  items: PaymentListItem[];
  page: number;
  limit: number;
  total: number;
}
