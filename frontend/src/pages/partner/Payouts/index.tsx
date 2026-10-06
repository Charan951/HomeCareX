import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { payoutsApi } from '../../../services/payoutsApi';
import type { PayoutStatus, PayoutsList } from '../../../types/payouts';
import {
  STATUS_LABEL,
  dateInfo,
  formatDate,
  formatMethod,
  formatMoney,
} from './payoutsFormat';
import './Payouts.css';

type Filter = 'all' | PayoutStatus;

const FILTERS: Filter[] = ['all', 'pending', 'processing', 'paid', 'failed'];

const STEPS = ['Requested', 'Processing', 'Paid'];

const filterLabel = (filter: Filter) =>
  filter === 'all' ? 'All' : STATUS_LABEL[filter];

const stepIndex = (status: PayoutStatus) => {
  if (status === 'processing') return 1;
  if (status === 'paid') return 2;
  return 0;
};

function CopyId({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  return (
    <button
      type="button"
      className="copy-btn"
      onClick={event => {
        event.stopPropagation();
        void copy();
      }}
      aria-label={`Copy transaction ID ${value}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function StatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <span className={`status status--${status}`}>
      <span className="status__dot" aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  );
}

function TxnIcon({ status }: { status: PayoutStatus }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  return (
    <span className={`txn__icon txn__icon--${status}`}>
      {status === 'paid' && (
        <svg {...common}>
          <path d="M17 7L7 17M7 9v8h8" />
        </svg>
      )}
      {status === 'processing' && (
        <svg {...common}>
          <path d="M21 12a9 9 0 1 1-3-6.7M21 4v5h-5" />
        </svg>
      )}
      {status === 'pending' && (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      )}
      {status === 'failed' && (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
      )}
    </span>
  );
}

type Payout = PayoutsList['history'][number];

const STATUS_NOTE: Record<PayoutStatus, string> = {
  pending: 'Waiting to be processed.',
  processing: 'On its way to your account.',
  paid: 'Sent to your account.',
  failed: 'This payout could not be completed.',
};

function PayoutDetails({
  payout,
  onClose,
}: {
  payout: Payout;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const date = dateInfo(payout);

  useEffect(() => {
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="sheet__handle" aria-hidden="true" />

        <header className="sheet__header">
          <div>
            <p className="eyebrow">Payout details</p>
            <h2 id="sheet-title">{formatMoney(payout.amount)}</h2>
          </div>

          <button
            ref={closeRef}
            type="button"
            className="sheet__close"
            onClick={onClose}
            aria-label="Close details"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="sheet__status">
          <StatusBadge status={payout.status} />
          <p>{STATUS_NOTE[payout.status]}</p>
        </div>

        <dl className="sheet__list">
          <div>
            <dt>Status</dt>
            <dd>{STATUS_LABEL[payout.status]}</dd>
          </div>
          <div>
            <dt>{date.label}</dt>
            <dd>{date.value}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{formatMoney(payout.amount)}</dd>
          </div>
          <div>
            <dt>Method</dt>
            <dd>{formatMethod(payout.method)}</dd>
          </div>
          <div>
            <dt>Transaction ID</dt>
            <dd>
              {payout.transactionId ? (
                <span className="sheet__txn">
                  <code>{payout.transactionId}</code>
                  <CopyId value={payout.transactionId} />
                </span>
              ) : (
                <span className="muted">—</span>
              )}
            </dd>
          </div>
          {payout.batchId && (
            <div>
              <dt>Batch ID</dt>
              <dd>
                <code>{payout.batchId}</code>
              </dd>
            </div>
          )}
          <div>
            <dt>Requested</dt>
            <dd>{formatDate(payout.createdAt)}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: 'paid' | 'progress' | 'failed';
}) {
  return (
    <article className={`stat stat--${tone}`}>
      <span className="stat__label">
        <span className="stat__pip" aria-hidden="true" />
        {label}
      </span>
      <strong className="stat__value">{value}</strong>
      <span className="stat__hint">{hint}</span>
    </article>
  );
}

export default function Payouts() {
  const [data, setData] = useState<PayoutsList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [filter, setFilter] = useState<Filter>('all');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<Payout['id'] | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const result = await payoutsApi.list();
      setData(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      void load();
    };
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [load]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const closeDetails = useCallback(() => setSelectedId(null), []);

  const history = data?.history ?? [];
  const selected =
    selectedId === null ? undefined : history.find(p => p.id === selectedId);

  const count = (status: Filter) =>
    history.filter(p => status === 'all' || p.status === status).length;

  const sumOf = (predicate: (status: PayoutStatus) => boolean) =>
    history
      .filter(p => predicate(p.status))
      .reduce((total, p) => total + p.amount, 0);

  const rows = useMemo(
    () => history.filter(p => filter === 'all' || p.status === filter),
    [history, filter],
  );

  const failedCount = count('failed');
  const inProgressCount = count('pending') + count('processing');

  return (
    <main className="payouts-page" aria-busy={loading}>
      <div className="payouts-container">
        <header className="payouts-header">
          <h1>Partner Payouts</h1>
        </header>

        {!online && (
          <div className="banner banner--offline" role="status">
            <span className="banner__dot" aria-hidden="true" />
            You are offline. Payout information may be out of date.
          </div>
        )}

        {loading && (
          <div
            className="loading-state"
            role="status"
            aria-label="Loading payouts"
          >
            <div className="skeleton skeleton--hero" />
            <div className="skeleton-row">
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
              <div className="skeleton skeleton--card" />
            </div>
            <div className="skeleton skeleton--table" />
          </div>
        )}

        {!loading && error && (
          <section className="empty-state" role="alert">
            <div className="empty-state__icon">!</div>
            <h2>{online ? 'Unable to load payouts' : 'No connection'}</h2>
            <p>
              {online
                ? 'Something went wrong while loading your payout history.'
                : 'Check your internet connection and try again.'}
            </p>
            <button
              type="button"
              className="primary-btn"
              onClick={() => void load()}
            >
              Try again
            </button>
          </section>
        )}

        {!loading && !error && data && (
          <>
            <section className="hero" aria-labelledby="next-payout">
              <div className="hero__top">
                <div>
                  <p id="next-payout" className="hero__label">
                    Next payout
                  </p>

                  {data.next ? (
                    <>
                      <div className="hero__amount">
                        {formatMoney(data.next.amount)}
                      </div>
                      <p className="hero__meta">
                        {data.next.expectedDate ? (
                          <>
                            Expected on{' '}
                            <strong>{formatDate(data.next.expectedDate)}</strong>
                          </>
                        ) : (
                          'Date will be confirmed soon'
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="hero__amount hero__amount--empty">
                        Nothing scheduled
                      </div>
                      <p className="hero__meta">
                        Your next payout will appear here once it is scheduled.
                      </p>
                    </>
                  )}
                </div>

                {data.next && <StatusBadge status={data.next.status} />}
              </div>

              {data.next && (
                <ol className="stepper" aria-label="Payout progress">
                  {STEPS.map((step, index) => {
                    const current = stepIndex(data.next!.status);
                    const state =
                      index < current
                        ? 'done'
                        : index === current
                          ? 'current'
                          : 'todo';

                    return (
                      <li
                        key={step}
                        className={`stepper__step stepper__step--${state}`}
                        aria-current={state === 'current' ? 'step' : undefined}
                      >
                        <span className="stepper__circle">
                          {state === 'done' ? '✓' : index + 1}
                        </span>
                        <span className="stepper__name">{step}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

            <section className="stats" aria-label="Payout summary">
              <Stat
                label="Total paid"
                value={formatMoney(sumOf(s => s === 'paid'))}
                hint={`${count('paid')} completed`}
                tone="paid"
              />
              <Stat
                label="In progress"
                value={formatMoney(
                  sumOf(s => s === 'pending' || s === 'processing'),
                )}
                hint={`${inProgressCount} on the way`}
                tone="progress"
              />
              <Stat
                label="Failed"
                value={String(failedCount)}
                hint="needs attention"
                tone="failed"
              />
            </section>

            {failedCount > 0 && filter !== 'failed' && (
              <div className="banner banner--failed" role="status">
                <span className="banner__dot" aria-hidden="true" />
                <span>
                  {failedCount} {failedCount === 1 ? 'payout has' : 'payouts have'} failed.
                </span>
                <button
                  type="button"
                  className="banner__action"
                  onClick={() => setFilter('failed')}
                >
                  Review
                </button>
              </div>
            )}

            <section className="history" aria-labelledby="history-title">
              <div className="history__header">
                <div>
                  <p className="eyebrow">Transactions</p>
                  <h2 id="history-title">Payout history</h2>
                </div>

                <div className="filter-wrapper" ref={menuRef}>
                  <button
                    type="button"
                    className={`filter-btn ${filter !== 'all' ? 'filter-btn--active' : ''}`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label={`Filter payouts (showing ${filterLabel(filter)})`}
                    onClick={() => setMenuOpen(open => !open)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 4h-7M10 4H3M21 12h-9M8 12H3M21 20h-5M12 20H3M14 2v4M8 10v4M16 18v4" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <ul
                      className="filter-menu"
                      role="menu"
                      aria-label="Filter payouts"
                    >
                      {FILTERS.map(status => (
                        <li key={status} role="none">
                          <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={filter === status}
                            className={`filter-item ${filter === status ? 'filter-item--active' : ''}`}
                            onClick={() => {
                              setFilter(status);
                              setMenuOpen(false);
                            }}
                          >
                            <span>{filterLabel(status)}</span>
                            <span className="filter-item__count">
                              {count(status)}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {rows.length === 0 ? (
                <div className="empty-state empty-state--inline">
                  <div className="empty-state__icon">↗</div>
                  <h3>
                    {history.length === 0
                      ? 'No payouts yet'
                      : 'No matching payouts'}
                  </h3>
                  <p>
                    {history.length === 0
                      ? 'Payouts marked as paid will appear here.'
                      : 'Try selecting another status.'}
                  </p>
                  {history.length > 0 && (
                    <button
                      type="button"
                      className="primary-btn primary-btn--ghost"
                      onClick={() => setFilter('all')}
                    >
                      Show all payouts
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop / tablet table (hidden on phones) */}
                  <div className="table-wrapper">
                    <table className="payout-table">
                      <thead>
                        <tr>
                          <th scope="col">Date</th>
                          <th scope="col" className="num">Amount</th>
                          <th scope="col">Method</th>
                          <th scope="col">Transaction ID</th>
                          <th scope="col">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {rows.map(payout => {
                          const date = dateInfo(payout);

                          return (
                            <tr
                              key={payout.id}
                              className="payout-row"
                              tabIndex={0}
                              aria-haspopup="dialog"
                              onClick={() => setSelectedId(payout.id)}
                              onKeyDown={event => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  setSelectedId(payout.id);
                                }
                              }}
                            >
                              <td data-label="Date">
                                <div className="date-cell">
                                  <strong>{date.value}</strong>
                                  <span>{date.label}</span>
                                </div>
                              </td>

                              <td className="amount-cell num" data-label="Amount">
                                {formatMoney(payout.amount)}
                              </td>

                              <td
                                data-label="Method"
                                className={payout.method ? undefined : 'cell--empty'}
                              >
                                <span className="method-cell">
                                  {formatMethod(payout.method)}
                                </span>
                              </td>

                              <td
                                data-label="Transaction ID"
                                className={payout.transactionId ? undefined : 'cell--empty'}
                              >
                                {payout.transactionId ? (
                                  <div className="transaction-cell">
                                    <code>{payout.transactionId}</code>
                                    <CopyId value={payout.transactionId} />
                                  </div>
                                ) : (
                                  <span className="muted">—</span>
                                )}
                              </td>

                              <td data-label="Status">
                                <StatusBadge status={payout.status} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Phone transaction list (hidden on larger screens) */}
                  <ul className="txn-list" aria-label="Payout history">
                    {rows.map(payout => {
                      const date = dateInfo(payout);

                      return (
                        <li key={payout.id}>
                          <button
                            type="button"
                            className="txn"
                            aria-haspopup="dialog"
                            onClick={() => setSelectedId(payout.id)}
                          >
                            <TxnIcon status={payout.status} />

                            <span className="txn__body">
                              <span className="txn__title">
                                {payout.method ? formatMethod(payout.method) : 'Payout'}
                              </span>
                              <span className="txn__sub">
                                {date.label} · {date.value}
                              </span>
                            </span>

                            <span className="txn__end">
                              <span className={`txn__amount txn__amount--${payout.status}`}>
                                {payout.status === 'paid' ? '+' : ''}
                                {formatMoney(payout.amount)}
                              </span>
                              <span className={`txn__status txn__status--${payout.status}`}>
                                {STATUS_LABEL[payout.status]}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>

            {selected && (
              <PayoutDetails payout={selected} onClose={closeDetails} />
            )}
          </>
        )}
      </div>
    </main>
  );
}