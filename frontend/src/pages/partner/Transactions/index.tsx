import React, { useEffect, useMemo, useRef, useState } from 'react';
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
const LIMIT = 5;

const fmtMoney = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/** Small round icon per transaction type */
const Icon: React.FC<{ type: string }> = ({ type }) => {
  const paths: Record<string, string> = {
    earning: 'M12 5v14M6 13l6 6 6-6',            // arrow down: money received
    incentive: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
    payout: 'M7 17L17 7M8 7h9v9',                 // arrow up-right: sent to bank
    adjustment: 'M5 8h14M5 16h14M9 5v6M15 13v6',  // sliders
    refund_deduction: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3', // undo
  };
  return (
    <span className={`tx-icon tx-icon-${type}`} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export const PartnerTransactionsPage: React.FC = () => {
  const [data, setData] = useState<TransactionsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [type, setType] = useState<LedgerType | undefined>(undefined);
  const [menuOpen, setMenuOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const isMobile = useIsMobile();
  const limit = isMobile ? 10 : LIMIT;
  const [items, setItems] = useState<TransactionsPage['items']>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const reqId = useRef(0);

  const load = async (p: number, t?: LedgerType) => {
    const id = ++reqId.current;
    const append = isMobile && p > 1; // phones keep adding to the list
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    setMoreError(null);
    try {
      const res = await getTransactions(p, limit, t);
      if (id !== reqId.current) return; // a newer request replaced this one
      setData(res);
      setItems((prev) => (append ? [...prev, ...res.items] : res.items));
    } catch (e) {
      if (id !== reqId.current) return;
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      if (append) setMoreError(msg); else setError(msg);
    } finally {
      if (id === reqId.current) { setLoading(false); setLoadingMore(false); }
    }
  };

  useEffect(() => { setPage(1); }, [isMobile]);
  useEffect(() => { load(page, type); }, [page, type, limit]);

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

  // Group the current page's items by month, newest first
  const groups = useMemo(() => {
    const map = new Map<string, TransactionsPage['items']>();
    items.forEach((e) => {
      const k = monthLabel(e.createdAt);
      map.set(k, [...(map.get(k) ?? []), e]);
    });
    return Array.from(map.entries());
  }, [items]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasMore = !!data && data.page < totalPages;

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

  return (
    <div className="tx-page">
      <div className="tx-toolbar">
        <div className="tx-active">
          {type ? (
            <>
              <button className="tx-applied" onClick={() => changeType(undefined)} aria-label={`Remove ${TYPE_LABEL[type]} filter`}>
                {TYPE_LABEL[type]} <span aria-hidden="true">&times;</span>
              </button>
              {data && <span className="tx-muted">{data.total} result{data.total === 1 ? '' : 's'}</span>}
            </>
          ) : (
            data && <span className="tx-muted">{data.total} transaction{data.total === 1 ? '' : 's'}</span>
          )}
        </div>

        <div className="tx-filter" ref={filterRef}>
          <button
            className={`tx-filter-btn ${type ? 'tx-filter-btn-on' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 5h18l-7 8v6l-4 2v-8z" />
            </svg>
            Filter
            {type && <span className="tx-filter-dot" aria-hidden="true" />}
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
                  {type === t && <span className="tx-check" aria-hidden="true">&#10003;</span>}
                </button>
              ))}
              {type && (
                <button className="tx-clear" onClick={() => changeType(undefined)}>Clear filter</button>
              )}
            </div>
          )}
        </div>
      </div>


      {loading && (
        <div aria-busy="true" aria-live="polite">
          <div className="tx-skel" />
          <div className="tx-skel" />
          <div className="tx-skel" />
        </div>
      )}

      {!loading && error && (
        <div className="tx-state">
          <p className="tx-error" role="alert">{error}</p>
          <button className="tx-btn" onClick={() => load(page, type)}>Try again</button>
        </div>
      )}

      {!loading && !error && data && (
        <>
          {items.length === 0 ? (
            <p className="tx-muted">
              {type ? `No ${TYPE_LABEL[type].toLowerCase()} transactions yet.` : 'No transactions yet.'}
            </p>
          ) : (
            <div className="tx-table">
              <div className="tx-head" aria-hidden="true">
                <span>Description</span>
                <span>Type</span>
                <span>Date</span>
                <span>Amount</span>
              </div>
              {groups.map(([month, items]) => (
                <section key={month}>
                  <h2 className="tx-month">{month}</h2>
                  <ul className="tx-list">
                    {items.map((entry) => (
                      <li key={entry.id} className="tx-row">
                        <div className="tx-cell-main">
                          <Icon type={entry.type} />
                          <div className="tx-texts">
                            <span className="tx-desc">{entry.description}</span>
                            <span className="tx-sub">{TYPE_LABEL[entry.type]} &middot; {shortDate(entry.createdAt)}</span>
                          </div>
                        </div>
                        <span className={`tx-type tx-type-${entry.type}`}>{TYPE_LABEL[entry.type]}</span>
                        <span className="tx-date">{fmtDate(entry.createdAt)}</span>
                        <span className={`tx-amount ${entry.amount < 0 ? 'tx-amount-neg' : 'tx-amount-pos'}`}>
                          {entry.amount < 0 ? '-' : '+'}{fmtMoney(Math.abs(entry.amount))}
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
                  <p className="tx-error" role="alert">{moreError}</p>
                  <button className="tx-btn" onClick={() => load(page, type)}>Try again</button>
                </>
              )}
              {!hasMore && items.length > 0 && <p className="tx-end">You&rsquo;re all caught up</p>}
            </div>
          ) : (
            <div className="tx-pagination">
              <button className="tx-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
                Previous
              </button>
              <span className="tx-page-info">Page {data.page} of {totalPages}</span>
              <button className="tx-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PartnerTransactionsPage;