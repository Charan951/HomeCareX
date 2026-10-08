import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getTransactions, type TransactionsPage } from './transactions.api';
import type { LedgerType } from '../Wallet/wallet.api';
import './Transactions.css';

const TYPE_LABEL: Record<string, string> = {
  earning: 'Earning',
  incentive: 'Incentive',
  adjustment: 'Adjustment',
  payout: 'Payout',
  refund_deduction: 'Refund deduction',
};

const TYPES: LedgerType[] = ['earning', 'incentive', 'adjustment', 'payout', 'refund_deduction'];
const LIMIT = 8;

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Small rounded icon per transaction type */
const Icon: React.FC<{ type: string }> = ({ type }) => {
  const paths: Record<string, string> = {
    earning: 'M12 5v14M6 13l6 6 6-6',
    incentive: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
    payout: 'M7 17L17 7M8 7h9v9',
    adjustment: 'M5 8h14M5 16h14M9 5v6M15 13v6',
    refund_deduction: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
  };
  return (
    <span className={`tx-icon tx-icon-${type}`} aria-hidden="true">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[type] ?? paths.adjustment} />
      </svg>
    </span>
  );
};

/** True on phone-sized screens (matches the CSS breakpoint) */
const useIsMobile = (query = '(max-width: 720px)') => {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
};

/** Tracks the browser's online/offline state */
const useOnline = () => {
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
};

export const PartnerTransactionsPage: React.FC = () => {
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<LedgerType | undefined>(undefined);
  const [from, setFrom] = useState(''); // YYYY-MM-DD, '' = no lower bound
  const [to, setTo] = useState(''); // YYYY-MM-DD, '' = no upper bound
  const [menuOpen, setMenuOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const online = useOnline();
  const limit = isMobile ? 10 : LIMIT;
  const [items, setItems] = useState<TransactionsPage['items']>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  const rangeInvalid = from !== '' && to !== '' && from > to;
  const hasFilters = !!type || from !== '' || to !== '';

  const load = useCallback(
    async (p: number, t?: LedgerType, f?: string, u?: string) => {
      const id = ++reqId.current;
      const append = isMobile && p > 1; // phones keep adding to the list
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      setMoreError(null);
      try {
        const res = await getTransactions(p, limit, t, f || undefined, u || undefined);
        if (id !== reqId.current) return; // a newer request replaced this one
        setData(res);
        setItems((prev) => (append ? [...prev, ...res.items] : res.items));
      } catch (e) {
        if (id !== reqId.current) return;
        const msg = e instanceof Error ? e.message : 'Something went wrong';
        if (append) setMoreError(msg);
        else setError(msg);
      } finally {
        if (id === reqId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [isMobile, limit],
  );

  useEffect(() => {
    setPage(1);
  }, [isMobile]);

  useEffect(() => {
    if (rangeInvalid) {
      // Don't call the API with an impossible range; show the hint instead.
      reqId.current += 1;
      setLoading(false);
      setItems([]);
      setData(null);
      return;
    }
    load(page, type, from, to);
  }, [load, page, type, from, to, rangeInvalid]);

  // Refresh automatically once the connection comes back
  const wasOnline = useRef(online);
  useEffect(() => {
    if (online && !wasOnline.current && !rangeInvalid) load(page, type, from, to);
    wasOnline.current = online;
  }, [online, load, page, type, from, to, rangeInvalid]);

  // Close the filter menu on outside click or Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const changeType = (t?: LedgerType) => {
    setType(t);
    setPage(1);
    setMenuOpen(false);
  };

  const changeFrom = (v: string) => {
    setFrom(v);
    setPage(1);
  };
  const changeTo = (v: string) => {
    setTo(v);
    setPage(1);
  };

  const clearDates = () => {
    setFrom('');
    setTo('');
    setPage(1);
  };

  const clearAll = () => {
    setType(undefined);
    setFrom('');
    setTo('');
    setPage(1);
    setMenuOpen(false);
  };

  // Group the loaded items by month, newest first
  const groups = useMemo(() => {
    const map = new Map<string, TransactionsPage['items']>();
    items.forEach((e) => {
      const k = monthLabel(e.createdAt);
      map.set(k, [...(map.get(k) ?? []), e]);
    });
    return Array.from(map.entries());
  }, [items]);

  // Totals for the rows currently loaded (the API does not return whole-filter totals)
  const sums = useMemo(() => {
    const moneyIn = items.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0);
    const moneyOut = items.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
    return { moneyIn, moneyOut };
  }, [items]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasMore = !!data && data.page < totalPages;
  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.limit + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.limit, data.total) : 0;

  // Phones: load the next page when the bottom of the list scrolls into view
  useEffect(() => {
    if (!isMobile || !hasMore || loading || loadingMore || moreError) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          io.disconnect();
          setPage((p) => p + 1);
        }
      },
      { rootMargin: '240px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [isMobile, hasMore, loading, loadingMore, moreError, items.length]);

  const emptyMessage = hasFilters ? 'No transactions match these filters.' : 'No transactions yet.';

  return (
    <div className="tx-page">
      {!online && (
        <p className="tx-offline" role="status">
          You&rsquo;re offline. We&rsquo;ll refresh this list when you&rsquo;re back online.
        </p>
      )}

      {/* ---------- Heading + Filter ---------- */}
      <header className="tx-header">
        <div className="tx-heading">
          <h2 className="tx-title">Transaction history</h2>
          <p className="tx-subtitle">Every credit and debit in your wallet, newest first.</p>
        </div>

        <div className="tx-filter" ref={filterRef}>
          <button
            className={`tx-filter-btn ${hasFilters ? 'tx-filter-btn-on' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 5h18l-7 8v6l-4 2v-8z" />
            </svg>
            Filter
            {hasFilters && <span className="tx-filter-dot" aria-hidden="true" />}
          </button>

          {menuOpen && (
            <div className="tx-menu" role="listbox" aria-label="Filter by type">
              <p className="tx-menu-title">Transaction type</p>
              {TYPES.map((t) => (
                <button
                  key={t}
                  role="option"
                  aria-selected={type === t}
                  className={`tx-option ${type === t ? 'tx-option-active' : ''}`}
                  onClick={() => changeType(t)}
                >
                  <span className={`tx-opt-dot tx-tag-${t}`} aria-hidden="true" />
                  {TYPE_LABEL[t]}
                  {type === t && (
                    <span className="tx-check" aria-hidden="true">
                      &#10003;
                    </span>
                  )}
                </button>
              ))}
              {hasFilters && (
                <button className="tx-clear" onClick={clearAll}>
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ---------- Summary cards ---------- */}
      {data && !rangeInvalid && !loading && !error && (
        <div className="tx-summary">
          <div className="tx-sum-card">
            <span className="tx-sum-label">{hasFilters ? 'Matching transactions' : 'Total transactions'}</span>
            <span className="tx-sum-value">{data.total}</span>
          </div>
          <div className="tx-sum-card">
            <span className="tx-sum-label">Money in (loaded rows)</span>
            <span className="tx-sum-value tx-sum-pos">+{fmtMoney(sums.moneyIn)}</span>
          </div>
          <div className="tx-sum-card">
            <span className="tx-sum-label">Money out (loaded rows)</span>
            <span className="tx-sum-value tx-sum-neg">-{fmtMoney(sums.moneyOut)}</span>
          </div>
        </div>
      )}

      {/* ---------- Main card: dates + table + paging ---------- */}
      <section className="tx-card" aria-label="Transactions">
        <div className="tx-card-bar">
          <div className="tx-dates" role="group" aria-label="Filter by date">
            <label className="tx-date-field">
              <span>From</span>
              <input
                type="date"
                className="tx-date-input"
                value={from}
                max={to || undefined}
                onChange={(e) => changeFrom(e.target.value)}
              />
            </label>
            <label className="tx-date-field">
              <span>To</span>
              <input
                type="date"
                className="tx-date-input"
                value={to}
                min={from || undefined}
                onChange={(e) => changeTo(e.target.value)}
              />
            </label>
          </div>

          <div className="tx-active">
            {type && (
              <button className="tx-applied" onClick={() => changeType(undefined)} aria-label={`Remove ${TYPE_LABEL[type]} filter`}>
                {TYPE_LABEL[type]} <span aria-hidden="true">&times;</span>
              </button>
            )}
            {(from || to) && (
              <button type="button" className="tx-applied" onClick={clearDates}>
                Clear dates <span aria-hidden="true">&times;</span>
              </button>
            )}
          </div>
        </div>

        {rangeInvalid && (
          <p className="tx-error tx-inset" role="alert">
            The &ldquo;From&rdquo; date must be on or before the &ldquo;To&rdquo; date.
          </p>
        )}

        {loading && (
          <div className="tx-skels" aria-busy="true" aria-live="polite">
            <span className="tx-sr-only">Loading transactions</span>
            <div className="tx-skel" />
            <div className="tx-skel" />
            <div className="tx-skel" />
            <div className="tx-skel" />
          </div>
        )}

        {!loading && error && (
          <div className="tx-state tx-inset">
            <p className="tx-error" role="alert">
              {error}
            </p>
            <button className="tx-btn" onClick={() => load(page, type, from, to)}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !rangeInvalid && data && (
          <>
            {items.length === 0 ? (
              <div className="tx-empty">
                <p className="tx-empty-title">{emptyMessage}</p>
                {hasFilters && (
                  <button className="tx-btn" onClick={clearAll}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="tx-table">
                <div className="tx-head" aria-hidden="true">
                  <span>Description</span>
                  <span>Type</span>
                  <span>Date</span>
                  <span>Amount</span>
                </div>
                {groups.map(([month, monthItems]) => (
                  <section key={month}>
                    <h3 className="tx-month">{month}</h3>
                    <ul className="tx-list">
                      {monthItems.map((entry) => (
                        <li key={entry.id} className="tx-row">
                          <div className="tx-cell-main">
                            <Icon type={entry.type} />
                            <div className="tx-texts">
                              <span className="tx-desc">{entry.description}</span>
                              <span className="tx-sub">
                                {TYPE_LABEL[entry.type]} &middot; {shortDate(entry.createdAt)}
                              </span>
                            </div>
                          </div>
                          <span className={`tx-type tx-type-${entry.type}`}>{TYPE_LABEL[entry.type]}</span>
                          <span className="tx-date">
                            {fmtDate(entry.createdAt)}
                            {(entry as { status?: string }).status === 'pending' && (
                              <span className="tx-pending">Pending</span>
                            )}
                          </span>
                          <span className={`tx-amount ${entry.amount < 0 ? 'tx-amount-neg' : 'tx-amount-pos'}`}>
                            {entry.amount < 0 ? '-' : '+'}
                            {fmtMoney(Math.abs(entry.amount))}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}

            {isMobile ? (
              <div className="tx-more" ref={sentinelRef}>
                {loadingMore && <span className="tx-spinner" role="status" aria-label="Loading more" />}
                {moreError && (
                  <>
                    <p className="tx-error" role="alert">
                      {moreError}
                    </p>
                    <button className="tx-btn" onClick={() => load(page, type, from, to)}>
                      Try again
                    </button>
                  </>
                )}
                {!hasMore && items.length > 0 && <p className="tx-end">You&rsquo;re all caught up</p>}
              </div>
            ) : (
              <footer className="tx-footer">
                <span className="tx-footer-info">
                  {data.total > 0 ? `Showing ${rangeStart}\u2013${rangeEnd} of ${data.total}` : 'No results'}
                </span>
                <div className="tx-pagination">
                  <button className="tx-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                    Previous
                  </button>
                  <span className="tx-page-info">
                    Page {data.page} of {totalPages}
                  </span>
                  <button
                    className="tx-page-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default PartnerTransactionsPage;