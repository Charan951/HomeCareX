import { useState } from "react";
import {
  Wallet as WalletIcon,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Gift,
  Plus,
  CreditCard,
  ChevronRight,
  Info,
} from "lucide-react";
import PageShell from "@/components/layout/PageShell";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  OfflineState,
} from "@/components/customer";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { LedgerTable } from "@/components/customer/payments";
import { formatMoney, useWallet } from "@/features/payments";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type { LedgerType } from "@/types/payment";

interface FilterOption {
  value: "" | LedgerType;
  label: string;
  icon?: typeof ArrowUp;
}

const FILTERS: FilterOption[] = [
  { value: "", label: "All" },
  { value: "credit", label: "Credits", icon: ArrowUp },
  { value: "debit", label: "Debits", icon: ArrowDown },
  { value: "refund_credit", label: "Refunds", icon: RotateCcw },
  { value: "referral_reward", label: "Referral Rewards", icon: Gift },
];

/** Wallet: route /customer/wallet. Balance plus credits, debits, refund credits and referral rewards. */
export default function Wallet() {
  const online = useOnlineStatus();
  const [page, setPage] = useState(1);
  const [type, setType] = useState<"" | LedgerType>("");
  const { data, isLoading, isError, error, refetch, isFetching } = useWallet(
    page,
    type || undefined,
  );

  if (isLoading) {
    return (
      <PageShell
        title="My Wallet"
        description="Manage your balance, refunds and rewards"
      >
        <LoadingState label="Loading your wallet…" />
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell
        title="My Wallet"
        description="Manage your balance, refunds and rewards"
      >
        {!online ? (
          <OfflineState onRetry={() => void refetch()} />
        ) : (
          <ErrorState
            title="Couldn't load your wallet"
            message={error?.message}
            onRetry={() => void refetch()}
          />
        )}
      </PageShell>
    );
  }

  const { ledger } = data;
  const totalPages = Math.max(1, Math.ceil(ledger.total / ledger.limit));

  return (
    <PageShell
      title="My Wallet"
      description="Manage your balance, refunds and rewards"
    >
      <div className="w-full max-w-full space-y-6 overflow-x-hidden">
        {/* Top Cards: Balance & Quick Actions */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          {/* Wallet Balance Card */}
          <section
            aria-label="Wallet balance"
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#231254] via-[#20104e] to-[#170a3c] p-5 text-white shadow-md sm:p-6 lg:col-span-7"
          >
            {/* Background Decorative Accent */}
            <div
              className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-orange-500/20 blur-2xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-6 bottom-0 h-16 w-32 rounded-tl-full bg-gradient-to-tl from-amber-500/40 to-transparent opacity-80"
              aria-hidden="true"
            />

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-white/80 sm:text-sm">
                  Wallet Balance
                </p>
                <p
                  className="mt-2 text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl lg:text-4xl"
                  aria-live="polite"
                >
                  {formatMoney(data.balance)}
                </p>
              </div>

              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm sm:h-12 sm:w-12"
                aria-hidden="true"
              >
                <WalletIcon className="h-6 w-6" />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-1.5 text-xs text-white/70">
              <span>Available balance</span>
              <Info className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
            </div>
          </section>

          {/* Quick Actions Panel */}
          <section
            aria-label="Quick actions"
            className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5 lg:col-span-5"
          >
            <h2 className="text-sm font-bold text-ink sm:text-base">
              Quick Actions
            </h2>
            <div className="mt-3 divide-y divide-line/60">
              {/* Add Money */}
              <button
                type="button"
                onClick={() => {
                  /* Connect to top-up flow or trigger modal */
                }}
                className={`group flex min-h-[44px] w-full items-center justify-between py-2 text-left transition-colors hover:bg-canvas/50 focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand ${FOCUS_RING}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink sm:text-sm">
                      Add Money
                    </p>
                    <p className="truncate text-[11px] text-muted sm:text-xs">
                      Top up your wallet
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>

              {/* View Transactions */}
              <button
                type="button"
                onClick={() => {
                  setType("");
                  setPage(1);
                }}
                className={`group flex min-h-[44px] w-full items-center justify-between py-2 text-left transition-colors hover:bg-canvas/50 focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand ${FOCUS_RING}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <CreditCard className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink sm:text-sm">
                      View Transactions
                    </p>
                    <p className="truncate text-[11px] text-muted sm:text-xs">
                      See all your transactions
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>

              {/* Referral Rewards */}
              <button
                type="button"
                onClick={() => {
                  setType("referral_reward");
                  setPage(1);
                }}
                className={`group flex min-h-[44px] w-full items-center justify-between py-2 text-left transition-colors hover:bg-canvas/50 focus:outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-brand ${FOCUS_RING}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Gift className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink sm:text-sm">
                      Referral Rewards
                    </p>
                    <p className="truncate text-[11px] text-muted sm:text-xs">
                      Invite friends &amp; earn
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </button>
            </div>
          </section>
        </div>

        {/* Filter Pills (Clean Wrapping on 360px, No Horizontal Overflow) */}
        <section aria-label="Transaction filters" className="w-full">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => {
              const active = type === f.value;
              const Icon = f.icon;
              return (
                <button
                  key={f.value || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setType(f.value);
                    setPage(1);
                  }}
                  className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                    active
                      ? "bg-[#201547] text-white shadow-sm ring-1 ring-[#201547]"
                      : "border border-line bg-white text-ink hover:bg-canvas"
                  }`}
                >
                  {Icon && (
                    <Icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        active
                          ? "text-white"
                          : f.value === "credit"
                            ? "text-emerald-600"
                            : f.value === "debit"
                              ? "text-amber-600"
                              : f.value === "refund_credit"
                                ? "text-cyan-600"
                                : "text-purple-600"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Recent Transactions List / Table */}
        <section
          aria-label="Transactions history"
          className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-ink sm:text-base">
              Recent Transactions
            </h2>
            {type !== "" && (
              <button
                type="button"
                onClick={() => {
                  setType("");
                  setPage(1);
                }}
                className={`text-xs font-medium text-brand hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${FOCUS_RING}`}
              >
                View All Transactions &rarr;
              </button>
            )}
          </div>

          {ledger.items.length === 0 ? (
            <EmptyState
              title={
                type
                  ? "No transactions match this filter"
                  : "No wallet activity yet"
              }
              description={
                type
                  ? "Try a different filter."
                  : "Refunds, referral rewards and credits will appear here."
              }
            />
          ) : (
            <div className="w-full min-w-0">
              {/* Responsive table wrapper ensures wide ledger records won't force page scrolling */}
              <div className="w-full max-w-full overflow-x-auto">
                <LedgerTable entries={ledger.items} />
              </div>

              {/* Accessible Pagination */}
              <nav
                aria-label="Wallet pages"
                className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
              >
                <button
                  type="button"
                  onClick={() => setPage((n) => Math.max(1, n - 1))}
                  disabled={page <= 1 || isFetching}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-line bg-white px-4 text-xs font-semibold text-ink shadow-sm hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${FOCUS_RING}`}
                >
                  Previous
                </button>
                <span
                  className="text-xs text-muted sm:text-sm"
                  aria-live="polite"
                >
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
                  disabled={page >= totalPages || isFetching}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-lg border border-line bg-white px-4 text-xs font-semibold text-ink shadow-sm hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 ${FOCUS_RING}`}
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}
