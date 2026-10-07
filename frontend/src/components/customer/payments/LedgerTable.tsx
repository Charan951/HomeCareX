import type { LedgerEntry, LedgerType } from "@/types/payment";
import { formatMoney } from "@/features/payments/money";

const TYPE_LABEL: Record<LedgerType, string> = {
  credit: "Credit",
  debit: "Debit",
  refund_credit: "Refund",
  referral_reward: "Referral reward",
};

const isDebit = (t: LedgerType) => t === "debit";

const fmtDate = (iso: string): string =>
  new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function Amount({ entry }: { entry: LedgerEntry }) {
  const debit = isDebit(entry.type);
  return (
    <span
      className={`font-medium tabular-nums ${debit ? "text-danger" : "text-green-700"}`}
    >
      <span className="sr-only">{debit ? "minus " : "plus "}</span>
      {debit ? "−" : "+"}
      {formatMoney(entry.amount)}
    </span>
  );
}

/**
 * Wallet history. A real table from md up; stacked cards below that, so there is no sideways scroll at 360px.
 */
export default function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  return (
    <>
      <div className="hidden md:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">Wallet transactions</caption>
          <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="w-[22%] py-2 pr-3 font-semibold">
                Date
              </th>
              <th scope="col" className="w-[18%] py-2 pr-3 font-semibold">
                Type
              </th>
              <th scope="col" className="py-2 pr-3 font-semibold">
                Details
              </th>
              <th
                scope="col"
                className="w-[16%] py-2 pr-3 text-right font-semibold"
              >
                Amount
              </th>
              <th scope="col" className="w-[16%] py-2 text-right font-semibold">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-line last:border-0">
                <td className="py-2.5 pr-3 text-muted">
                  {fmtDate(e.createdAt)}
                </td>
                <td className="py-2.5 pr-3 text-ink">{TYPE_LABEL[e.type]}</td>
                <td className="break-words py-2.5 pr-3 text-ink">
                  {e.description}
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <Amount entry={e} />
                </td>
                <td className="py-2.5 text-right tabular-nums text-muted">
                  {formatMoney(e.balanceAfter)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 md:hidden">
        {entries.map((e) => (
          <li
            key={e.id}
            className="rounded border border-line bg-panel px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">
                  {TYPE_LABEL[e.type]}
                </p>
                <p className="break-words text-sm text-muted">
                  {e.description}
                </p>
              </div>
              <Amount entry={e} />
            </div>
            <div className="mt-1 flex justify-between gap-3 text-xs text-muted">
              <span>{fmtDate(e.createdAt)}</span>
              <span className="tabular-nums">
                Balance {formatMoney(e.balanceAfter)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
