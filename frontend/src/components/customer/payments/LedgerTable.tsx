import { ArrowDownLeft, ArrowUpRight, Gift, RotateCcw, XCircle } from "lucide-react";
import { formatMoney } from "@/features/payments";

interface LedgerItem {
  id?: string;
  _id?: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: typeof ArrowDownLeft; pillClass: string; isCredit: boolean }
> = {
  CREDIT: {
    label: "Added",
    icon: ArrowDownLeft,
    pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    isCredit: true,
  },
  credit: {
    label: "Added",
    icon: ArrowDownLeft,
    pillClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    isCredit: true,
  },
  REFUND: {
    label: "Refund",
    icon: RotateCcw,
    pillClass: "bg-blue-50 text-blue-700 border-blue-200",
    isCredit: true,
  },
  refund_credit: {
    label: "Refund",
    icon: RotateCcw,
    pillClass: "bg-blue-50 text-blue-700 border-blue-200",
    isCredit: true,
  },
  REFERRAL_REWARD: {
    label: "Reward",
    icon: Gift,
    pillClass: "bg-purple-50 text-purple-700 border-purple-200",
    isCredit: true,
  },
  referral_reward: {
    label: "Reward",
    icon: Gift,
    pillClass: "bg-purple-50 text-purple-700 border-purple-200",
    isCredit: true,
  },
  DEBIT: {
    label: "Spent",
    icon: ArrowUpRight,
    pillClass: "bg-stone-100 text-stone-700 border-stone-200",
    isCredit: false,
  },
  debit: {
    label: "Spent",
    icon: ArrowUpRight,
    pillClass: "bg-stone-100 text-stone-700 border-stone-200",
    isCredit: false,
  },
  FAILED: {
    label: "Payment Failed",
    icon: XCircle,
    pillClass: "bg-rose-50 text-rose-700 border-rose-200",
    isCredit: false,
  },
  failed: {
    label: "Payment Failed",
    icon: XCircle,
    pillClass: "bg-rose-50 text-rose-700 border-rose-200",
    isCredit: false,
  },
};

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function LedgerTable({
  entries,
  items,
}: {
  entries?: LedgerItem[];
  items?: LedgerItem[];
}) {
  const rows = entries || items || [];

  return (
    <div>
      {/* Desktop View */}
      <div className="hidden overflow-hidden rounded-xl border border-line bg-panel md:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">Wallet transaction history</caption>
          <thead className="border-b border-line bg-canvas">
            <tr>
              <th scope="col" className="w-[22%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Type
              </th>
              <th scope="col" className="w-[33%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Description
              </th>
              <th scope="col" className="w-[20%] px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                Date
              </th>
              <th scope="col" className="w-[25%] px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const cfg = TYPE_CONFIG[row.type] || {
                label: row.type,
                icon: ArrowDownLeft,
                pillClass: "bg-stone-100 text-stone-700 border-stone-200",
                isCredit: false,
              };
              const Icon = cfg.icon;
              const isFailed = row.type.toLowerCase() === "failed";

              return (
                <tr key={row._id || row.id} className="transition-colors hover:bg-canvas/60">
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.pillClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="truncate font-medium text-ink" title={row.description}>
                      {row.description}
                    </p>
                    {row.referenceId && (
                      <span className="font-mono text-xs text-muted">
                        Ref: {row.referenceId.slice(-10)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-muted">{fmtDate(row.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right font-medium tabular-nums">
                    {isFailed ? (
                      <span className="text-rose-600 line-through">
                        {formatMoney(row.amount)}
                      </span>
                    ) : (
                      <span className={cfg.isCredit ? "text-emerald-600" : "text-ink"}>
                        {cfg.isCredit ? "+" : "-"}
                        {formatMoney(row.amount)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const cfg = TYPE_CONFIG[row.type] || {
            label: row.type,
            icon: ArrowDownLeft,
            pillClass: "bg-stone-100 text-stone-700 border-stone-200",
            isCredit: false,
          };
          const Icon = cfg.icon;
          const isFailed = row.type.toLowerCase() === "failed";

          return (
            <li
              key={row._id || row.id}
              className="flex min-w-0 flex-col rounded-xl border border-line bg-panel p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.pillClass}`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {cfg.label}
                </span>
                <span
                  className={`text-base font-semibold tabular-nums ${
                    isFailed
                      ? "text-rose-600 line-through"
                      : cfg.isCredit
                      ? "text-emerald-600"
                      : "text-ink"
                  }`}
                >
                  {!isFailed && (cfg.isCredit ? "+" : "-")}
                  {formatMoney(row.amount)}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-ink">{row.description}</p>
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>{fmtDate(row.createdAt)}</span>
                {row.referenceId && <span>Ref: {row.referenceId.slice(-8)}</span>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// Satisfies barrel exports like: export { default as LedgerTable } from './LedgerTable'
export default LedgerTable;