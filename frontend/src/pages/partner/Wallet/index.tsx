import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { getWalletSummary, type WalletSummary } from './wallet.api';
import './Wallet.css';

type Entry = WalletSummary['recent'][number];
type Filter = 'all' | 'in' | 'out';

const TYPE_LABEL: Record<string, string> = {
  earning: 'Earning',
  incentive: 'Incentive',
  adjustment: 'Adjustment',
  payout: 'Payout',
  refund_deduction: 'Refund deduction',
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in', label: 'Money in' },
  { key: 'out', label: 'Money out' },
];

/* ---------- formatters ---------- */

const moneyFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const fmtMoney = (n: number) => moneyFormat.format(n);

const signed = (n: number) => {
  const rounded = Math.round(n);
  if (rounded === 0) return fmtMoney(0);
  return `${rounded < 0 ? '-' : '+'}${fmtMoney(Math.abs(rounded))}`;
};

const fmtFull = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  });

const dayKey = (iso: string) => new Date(iso).toDateString();

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    ...(d.getFullYear() !== today.getFullYear() && { year: 'numeric' }),
  });
};

const amountClass = (n: number) =>
  n < 0 ? 'wl-amount-neg' : 'wl-amount-pos';

/* ---------- hooks ---------- */

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia(query).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/* ---------- icon ---------- */

const ICON_PATHS: Record<string, string> = {
  earning: 'M12 5v14M6 13l6 6 6-6',
  incentive:
    'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.2 6.5 20.2l1-6.2L3 9.6l6.2-.9z',
  payout: 'M7 17L17 7M8 7h9v9',
  adjustment: 'M5 8h14M5 16h14M9 5v6M15 13v6',
  refund_deduction: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
};

const Icon: React.FC<{ type: string }> = ({ type }) => (
  <span
    className={`wl-icon wl-icon-${ICON_PATHS[type] ? type : 'adjustment'}`}
    aria-hidden="true"
  >
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICON_PATHS[type] ?? ICON_PATHS.adjustment} />
    </svg>
  </span>
);

/* ---------- detail sheet ---------- */

const EntrySheet: React.FC<{
  entry: Entry;
  onClose: () => void;
}> = ({ entry, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  const rows: [string, string][] = [
    ['Type', TYPE_LABEL[entry.type] ?? entry.type],
    ['Date', fmtFull(entry.createdAt)],
    ['Reference', String(entry.id)],
  ];

  return (
    <div className="wl-overlay" onClick={onClose}>
      <div
        ref={sheetRef}
        className="wl-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Transaction details"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="wl-sheet-top">
          <Icon type={entry.type} />

          <button
            type="button"
            className="wl-close"
            onClick={onClose}
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        <p className={`wl-sheet-amount ${amountClass(entry.amount)}`}>
          {signed(entry.amount)}
        </p>

        <p className="wl-sheet-desc">{entry.description}</p>

        <dl className="wl-sheet-list">
          {rows.map(([key, value]) => (
            <div key={key} className="wl-sheet-row">
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          className="wl-btn wl-btn-block"
          onClick={onClose}
          autoFocus
        >
          Done
        </button>
      </div>
    </div>
  );
};

/* ---------- page ---------- */

export const PartnerWalletPage: React.FC = () => {
  const [data, setData] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Entry | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const isDesktop = useMediaQuery('(min-width: 900px)');
  const summaryOpen = isDesktop || showSummary;

  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const result = await getWalletSummary();
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) {
        setError(
          e instanceof Error ? e.message : "We couldn't load your wallet."
        );
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  const closeSheet = useCallback(() => setSelected(null), []);

  const total = data ? data.available + data.pending : 0;
  const availablePct = total > 0 && data ? (data.available / total) * 100 : 0;
  const pendingPct = total > 0 ? 100 - availablePct : 0;

  /* Summary: totals + per-type rows scaled to the largest movement */
  const summary = useMemo(() => {
    const recent = data?.recent ?? [];

    let moneyIn = 0;
    let moneyOut = 0;
    const groups = new Map<string, { sum: number; count: number }>();

    for (const entry of recent) {
      if (entry.amount > 0) moneyIn += entry.amount;
      else if (entry.amount < 0) moneyOut += Math.abs(entry.amount);

      const g = groups.get(entry.type) ?? { sum: 0, count: 0 };
      g.sum += entry.amount;
      g.count += 1;
      groups.set(entry.type, g);
    }

    const types = [
      ...Object.keys(TYPE_LABEL).filter((t) => groups.has(t)),
      ...[...groups.keys()].filter((t) => !(t in TYPE_LABEL)),
    ];

    const maxAbs = Math.max(
      1,
      ...types.map((t) => Math.abs(groups.get(t)!.sum))
    );

    return {
      count: recent.length,
      moneyIn,
      moneyOut,
      net: moneyIn - moneyOut,
      byType: types.map((type) => {
        const g = groups.get(type)!;
        return {
          type,
          ...g,
          width: (Math.abs(g.sum) / maxAbs) * 100,
        };
      }),
    };
  }, [data]);

  /* Activity: filtered, then grouped by day (order preserved) */
  const activityGroups = useMemo(() => {
    const recent = data?.recent ?? [];
    const visible = recent.filter((e) =>
      filter === 'in' ? e.amount > 0 : filter === 'out' ? e.amount < 0 : true
    );

    const groups: { key: string; label: string; items: Entry[] }[] = [];
    for (const entry of visible) {
      const key = dayKey(entry.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.items.push(entry);
      else
        groups.push({ key, label: dayLabel(entry.createdAt), items: [entry] });
    }
    return groups;
  }, [data, filter]);

  /* Desktop table: same filtered entries as one flat list */
  const tableRows = useMemo(
    () =>
      activityGroups.flatMap((g) =>
        g.items.map((entry) => ({ entry, label: g.label }))
      ),
    [activityGroups]
  );

  return (
    <div className="wl-page">
      {loading && (
        <div className="wl-body" aria-busy="true" aria-live="polite">
          <span className="wl-sr-only">Loading your wallet</span>
          <div className="wl-skel wl-skel-hero" />

          <div>
            <div className="wl-skel wl-skel-row" />
            <div className="wl-skel wl-skel-row" />
            <div className="wl-skel wl-skel-row" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="wl-state">
          <p className="wl-error" role="alert">
            {error}
          </p>

          <button type="button" className="wl-btn" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="wl-body">
          <div className="wl-side">
            {/* ---------- Balance ---------- */}
            <section className="wl-hero" aria-label="Balance">
              <span className="wl-hero-label">Available to withdraw</span>

              <span className="wl-hero-value">{fmtMoney(data.available)}</span>

              <div
                className="wl-split"
                role="img"
                aria-label={`${Math.round(
                  availablePct
                )}% of your balance is available, ${Math.round(
                  pendingPct
                )}% is pending`}
              >
                <span
                  className="wl-split-av"
                  style={{ width: `${availablePct}%` }}
                />
                <span
                  className="wl-split-pe"
                  style={{ width: `${pendingPct}%` }}
                />
              </div>

              <dl className="wl-hero-figures">
                <div>
                  <dt>
                    <i className="wl-key wl-key-av" />
                    Available
                  </dt>
                  <dd>{fmtMoney(data.available)}</dd>
                </div>

                <div>
                  <dt>
                    <i className="wl-key wl-key-pe" />
                    Pending
                  </dt>
                  <dd>{fmtMoney(data.pending)}</dd>
                </div>

                <div>
                  <dt>Total</dt>
                  <dd>{fmtMoney(total)}</dd>
                </div>
              </dl>
            </section>

            {/* ---------- Recent summary ---------- */}
            <section
              className="wl-summary"
              aria-label="Summary of recent activity"
            >
              {isDesktop ? (
                <div className="wl-summary-head">
                  <h2 className="wl-section-title">Recent summary</h2>
                  <span className="wl-summary-note">
                    Last {summary.count} transactions
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className="wl-summary-toggle"
                  aria-expanded={showSummary}
                  aria-controls="wl-summary-body"
                  onClick={() => setShowSummary((v) => !v)}
                >
                  <span className="wl-summary-head">
                    <span className="wl-section-title">Recent summary</span>
                    <span
                      className={`wl-summary-net ${amountClass(summary.net)}`}
                    >
                      {signed(summary.net)}
                    </span>
                  </span>

                  <svg
                    className={`wl-chevron${showSummary ? ' is-open' : ''}`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              )}

              <div
                id="wl-summary-body"
                className={`wl-summary-body${summaryOpen ? ' is-open' : ''}`}
              >
                <div className="wl-flow">
                  <div className="wl-flow-cell">
                    <span className="wl-flow-label">Money in</span>
                    <span className="wl-flow-value wl-amount-pos">
                      {fmtMoney(summary.moneyIn)}
                    </span>
                  </div>

                  <div className="wl-flow-cell">
                    <span className="wl-flow-label">Money out</span>
                    <span className="wl-flow-value wl-amount-neg">
                      {fmtMoney(summary.moneyOut)}
                    </span>
                  </div>

                  <div className="wl-flow-cell">
                    <span className="wl-flow-label">Net</span>
                    <span
                      className={`wl-flow-value ${amountClass(summary.net)}`}
                    >
                      {signed(summary.net)}
                    </span>
                  </div>
                </div>

                {summary.byType.length > 0 ? (
                  <ul className="wl-breakdown">
                    {summary.byType.map((item) => (
                      <li key={item.type}>
                        <div className="wl-bd-top">
                          <span className="wl-bd-name">
                            {TYPE_LABEL[item.type] ?? item.type}
                            <small>
                              {item.count}{' '}
                              {item.count === 1 ? 'transaction' : 'transactions'}
                            </small>
                          </span>

                          <span
                            className={`wl-amount ${amountClass(item.sum)}`}
                          >
                            {signed(item.sum)}
                          </span>
                        </div>

                        <div className="wl-bd-track" aria-hidden="true">
                          <span
                            className={`wl-bd-fill wl-fill-${item.type} ${
                              item.sum < 0 ? 'is-neg' : ''
                            }`}
                            style={{ width: `${item.width}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="wl-muted">Nothing to summarise yet.</p>
                )}
              </div>
            </section>
          </div>

          {/* ---------- Activity ---------- */}
          <section className="wl-activity" aria-label="Recent activity">
            <div className="wl-section-head">
              <h2 className="wl-section-title">Recent activity</h2>

              <Link to="/partner/transactions" className="wl-view-all">
                View all
              </Link>
            </div>

            {data.recent.length > 0 && (
              <div className="wl-filters" role="group" aria-label="Filter activity">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    className={`wl-filter${filter === f.key ? ' is-active' : ''}`}
                    aria-pressed={filter === f.key}
                    onClick={() => setFilter(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {data.recent.length === 0 ? (
              <p className="wl-muted">
                No transactions yet. Completed bookings will show up here.
              </p>
            ) : activityGroups.length === 0 ? (
              <p className="wl-muted">
                No {filter === 'in' ? 'money in' : 'money out'} in your recent
                activity.
              </p>
            ) : isDesktop ? (
              <div className="wl-table-wrap">
                <table className="wl-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Description</th>
                      <th scope="col">Type</th>
                      <th scope="col" className="wl-th-amount">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {tableRows.map(({ entry, label }) => (
                      /* Row click is a mouse convenience; the button in the
                         description cell is the keyboard/screen-reader target
                         (its click bubbles up to the row). */
                      <tr key={entry.id} onClick={() => setSelected(entry)}>
                        <td className="wl-td-date">
                          <span>{label}</span>
                          <small>{fmtTime(entry.createdAt)}</small>
                        </td>

                        <td>
                          <button type="button" className="wl-cell-btn">
                            <Icon type={entry.type} />
                            <span className="wl-desc">{entry.description}</span>
                          </button>
                        </td>

                        <td className="wl-td-type">
                          {TYPE_LABEL[entry.type] ?? entry.type}
                        </td>

                        <td
                          className={`wl-td-amount ${amountClass(entry.amount)}`}
                        >
                          {signed(entry.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              activityGroups.map((group) => (
                <div key={group.key} className="wl-day">
                  <h3 className="wl-day-label">{group.label}</h3>

                  <ul className="wl-list">
                    {group.items.map((entry) => (
                      <li key={entry.id}>
                        <button
                          type="button"
                          className="wl-row"
                          onClick={() => setSelected(entry)}
                        >
                          <Icon type={entry.type} />

                          <span className="wl-row-main">
                            <span className="wl-desc">{entry.description}</span>

                            <span className="wl-sub">
                              {TYPE_LABEL[entry.type] ?? entry.type}
                              {' · '}
                              {fmtTime(entry.createdAt)}
                            </span>
                          </span>

                          <span
                            className={`wl-amount ${amountClass(entry.amount)}`}
                          >
                            {signed(entry.amount)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>
        </div>
      )}

      {selected && <EntrySheet entry={selected} onClose={closeSheet} />}
    </div>
  );
};

export default PartnerWalletPage;