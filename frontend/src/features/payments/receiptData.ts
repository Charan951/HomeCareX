import { methodLabel } from "./methods";
import { formatMoney } from "./money";
import type { BookingView } from "@/types/booking";
import type { PaymentRecordStatus, PaymentRow } from "@/types/payment";

/** One row of the price table. `negative` rows (discounts) are shown as -₹X. */
export interface ReceiptLine {
  label: string;
  amount: number;
  negative?: boolean;
  /** Subtotal rows are drawn with a rule above them. */
  emphasis?: boolean;
}

export interface ReceiptData {
  receiptNo: string;
  paymentDate: string | null;
  status: PaymentRecordStatus;
  customer: { name?: string; email?: string; phone?: string };
  booking: {
    service: string;
    bookingRef: string;
    serviceDate?: string;
    serviceTime?: string;
    address?: string;
  };
  payment: { method: string; transactionId: string };
  lines: ReceiptLine[];
  /** The amount the backend recorded for this payment. Never recomputed here. */
  total: number;
}

export const STATUS_LABEL: Record<PaymentRecordStatus, string> = {
  PAID: "PAID",
  PENDING: "PENDING",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
};

export const fmtReceiptDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** "₹278.00" with a leading minus for discounts. */
export const fmtLine = (l: ReceiptLine): string =>
  l.negative ? `-${formatMoney(l.amount)}` : formatMoney(l.amount);

const sum = (xs: number[]): number => xs.reduce((a, b) => a + b, 0);

/**
 * Builds the receipt from data the app already has: the payment row, the booking's stored
 * price snapshot, and the signed-in customer. Rows with no value are left out, nothing is invented,
 * and the total is the payment amount from the backend.
 */
export function buildReceiptData(
  row: PaymentRow,
  booking: BookingView | undefined,
  user: { name?: string; email?: string; phone?: string } | null | undefined,
): ReceiptData {
  const snap = booking?.priceSnapshot;
  const lines: ReceiptLine[] = [];

  if (snap) {
    const base = sum(snap.lines.filter((l) => l.kind === "BASE").map((l) => l.amount));
    const addOns = sum(snap.lines.filter((l) => l.kind === "ADDON").map((l) => l.amount));
    lines.push({ label: "Service charge", amount: base });
    if (addOns > 0) lines.push({ label: "Add-ons", amount: addOns });
    lines.push({ label: "Subtotal", amount: snap.subtotal, emphasis: true });
    if (snap.surge && snap.surge > 0) lines.push({ label: "Surge charge", amount: snap.surge });
    if (snap.convenienceFee > 0) lines.push({ label: "Convenience fee", amount: snap.convenienceFee });
    if (snap.discount > 0) lines.push({ label: "Discount", amount: snap.discount, negative: true });
    if (snap.gst && snap.gst > 0) lines.push({ label: "GST", amount: snap.gst });
  }

  const a = booking?.addressSnapshot;
  const address = a
    ? [a.line1, a.line2, a.landmark, a.city, [a.state, a.pincode].filter(Boolean).join(" ")]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return {
    receiptNo: row.receiptNo ?? "—",
    paymentDate: row.paidAt ?? null,
    status: row.status,
    customer: { name: user?.name, email: user?.email, phone: user?.phone },
    booking: {
      service: row.serviceName,
      bookingRef: row.bookingRef,
      serviceDate: booking?.date ? fmtReceiptDate(booking.date) : undefined,
      serviceTime: booking?.slot ? booking.slot.replace(/\s*-\s*/g, "–") : undefined,
      address,
    },
    payment: { method: methodLabel(row.method), transactionId: row.id.slice(-8).toUpperCase() },
    lines,
    total: row.amount,
  };
}

export const receiptFileName = (receiptNo: string): string =>
  `HomeCareX-Receipt-${receiptNo.replace(/[^A-Za-z0-9_-]/g, "") || "receipt"}.pdf`;