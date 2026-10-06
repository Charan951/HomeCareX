import { useState } from "react";
import { Wallet as WalletIcon } from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import { EmptyState, ErrorState, LoadingState, OfflineState } from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { LedgerTable } from "@/components/customer/payments";
import { formatMoney, useWallet } from "@/features/payments";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { LedgerType } from "@/types/payment";

const FILTERS: { value: "" | LedgerType; label: string }[] = [
  { value: "", label: "All" },
  { value: "credit", label: "Credits" },
  { value: "debit", label: "Debits" },
  { value: "refund_credit", label: "Refunds" },
  { value: "referral_reward", label: "Referral rewards" },
];

/** Wallet: route /customer/wallet. Balance plus credits, debits, refund credits and referral rewards. */
export default function Wallet() {
  const online = useOnlineStatus();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"" | LedgerType>("");
  const { data, isLoading, isError, error, refetch, isFetching } = useWallet(page, type || undefined);

  if (isLoading) {
    return (
      <PageShell title="Wallet" description="Your balance and transactions.">
        <LoadingState label="Loading your wallet…" />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell title="Wallet" description="Your balance and transactions.">
        {!online ? (
          <OfflineState onRetry={() => void refetch()} />
        ) : (
          <ErrorState title="Couldn't load your wallet" message={error?.message} onRetry={() => void refetch()} />
        )}
      </PageShell>
    );
  }

  const { ledger } = data;
  const totalPages = Math.max(1, Math.ceil(ledger.total / ledger.limit));

  return (
    <PageShell title="Wallet" description="Your balance and transactions.">
      <section aria-label="Wallet balance" className="flex items-center gap-3 rounded border border-line bg-canvas px-4 py-3">
        <WalletIcon className="h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted">Available balance</p>
          <p className="text-2xl font-semibold tabular-nums text-ink" aria-live="polite">{formatMoney(data.balance)}</p>
        </div>
      </section>

      <div className="mb-3 mt-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink">History</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="wallet-type" className="text-sm text-muted">Show</label>
          <select
            id="wallet-type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as "" | LedgerType);
              setPage(1);
            }}
            className={`min-h-[44px] rounded border border-line bg-white px-3 text-sm text-ink ${FOCUS_RING}`}
          >
            {FILTERS.map((f) => (
              <option key={f.value || "all"} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {ledger.items.length === 0 ? (
        <EmptyState
          title={type ? "No transactions match this filter" : "No wallet activity yet"}
          description={type ? "Try a different filter." : "Refunds, referral rewards and credits will appear here."}
        />
      ) : (
        <>
          <LedgerTable entries={ledger.items} />
          <nav aria-label="Wallet pages" className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((n) => Math.max(1, n - 1))}
              disabled={page <= 1 || isFetching}
              className={`min-h-[44px] rounded border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
            >
              Previous
            </button>
            <span className="text-sm text-muted" aria-live="polite">Page {page} of {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
              disabled={page >= totalPages || isFetching}
              className={`min-h-[44px] rounded border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-canvas disabled:opacity-50 ${FOCUS_RING}`}
            >
              Next
            </button>
          </nav>
        </>
      )}
    </PageShell>
  );
}
