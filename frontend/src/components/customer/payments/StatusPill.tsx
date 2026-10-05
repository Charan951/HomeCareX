import type { PaymentRecordStatus } from "@/types/payment";

const STYLE: Record<PaymentRecordStatus, { label: string; cls: string }> = {
  PAID: { label: "Paid", cls: "bg-green-50 text-green-700" },
  PENDING: { label: "Pending", cls: "bg-accent-soft text-ink" },
  FAILED: { label: "Failed", cls: "bg-danger-soft text-danger" },
  REFUNDED: { label: "Refunded", cls: "bg-brand-soft text-brand" },
};

/** Status is always written out, never colour alone. */
export default function StatusPill({ status }: { status: PaymentRecordStatus }) {
  const s = STYLE[status];
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}
