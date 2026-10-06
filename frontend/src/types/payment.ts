/** Mirrors backend/src/modules/payments and /wallet. Money is INR (rupees) in every field. */

export type CheckoutMethod = "upi" | "card" | "netbanking" | "wallet" | "cod";

export type PaymentRecordStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/** What the checkout screen is showing right now. */
export type CheckoutPhase = "idle" | "pending" | "processing" | "successful" | "failed" | "cancelled" | "retry";

export interface PaymentRow {
  id: string;
  bookingId: string;
  bookingRef: string;
  serviceName: string;
  bookingDate: string | null;
  amount: number;
  currency: string;
  method: string | null;
  status: PaymentRecordStatus;
  paidAt: string | null;
  createdAt: string;
  receiptNo: string | null;
}

export interface PaymentsPage {
  items: PaymentRow[];
  page: number;
  limit: number;
  total: number;
}

export type LedgerType = "credit" | "debit" | "refund_credit" | "referral_reward";

export interface LedgerEntry {
  id: string;
  type: LedgerType;
  amount: number;
  balanceAfter: number;
  description: string;
  bookingId: string | null;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  currency: string;
  ledger: { items: LedgerEntry[]; page: number; limit: number; total: number };
}
