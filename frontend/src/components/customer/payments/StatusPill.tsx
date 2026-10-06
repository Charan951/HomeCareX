import type { PaymentRecordStatus } from "@/types/payment";

const STYLE: Record<
  PaymentRecordStatus,
  { label: string; cls: string; dot: string }
> = {
  PAID: {
    label: "Paid",
    cls: "bg-green-50 text-green-700",
    dot: "bg-green-600",
  },
  PENDING: {
    label: "Pending",
    cls: "bg-accent-soft text-ink",
    dot: "bg-accent",
  },
  FAILED: {
    label: "Failed",
    cls: "bg-danger-soft text-danger",
    dot: "bg-danger",
  },
  REFUNDED: {
    label: "Refunded",
    cls: "bg-brand-soft text-brand",
    dot: "bg-brand",
  },
};

/** Status is always written out, never colour alone. */
export default function StatusPill({
  status,
}: {
  status: PaymentRecordStatus;
}) {
  const s = STYLE[status];
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium ${s.cls}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
      />
      {s.label}
    </span>
  );
}
