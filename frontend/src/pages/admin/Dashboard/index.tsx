import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  HardHat,
  Headset,
  MapPin,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';
import {
  ALL_CITIES,
  CITIES,
  dashboardApi,
  dayDiff,
  toISO,
  type DashboardFilters,
  type FunnelStep,
  type Kpi,
  type Point,
  type SnapshotItem,
} from '@/services/dashboardApi';
import './dashboard.css';

// ---------- formatting ----------
const inr = (n: number) =>
  n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(2)} L` : `₹${Math.round(n).toLocaleString('en-IN')}`;
/** Short form for chart axes so labels never crowd the plot on a phone. */
const inrAxis = (n: number) =>
  n >= 1e7 ? `₹${+(n / 1e7).toFixed(1)}Cr` : n >= 1e5 ? `₹${+(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `₹${+(n / 1e3).toFixed(0)}k` : `₹${Math.round(n)}`;
const num = (n: number) => Math.round(n).toLocaleString('en-IN');
const numAxis = (n: number) => (n >= 1e5 ? `${+(n / 1e5).toFixed(1)}L` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}k` : `${Math.round(n)}`);
const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// ---------- widget state hook ----------
function useWidget<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: boolean }>({
    data: null,
    loading: true,
    error: false,
  });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: false }));
    loader()
      .then((data) => alive && setState({ data, loading: false, error: false }))
      .catch(() => alive && setState({ data: null, loading: false, error: true }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
type WidgetState<T> = ReturnType<typeof useWidget<T>>;

// ---------- shared widget shell (loading / error / content) ----------
function Widget<T>({
  title,
  state,
  children,
  className = '',
}: {
  title: string;
  state: WidgetState<T>;
  children: (data: T) => React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`dash-card ${className}`}>
      <h2 className="dash-card__title">{title}</h2>
      {state.loading && !state.data ? (
        <div className="dash-skeleton" aria-busy="true" />
      ) : state.error ? (
        <div className="dash-error" role="alert">
          <AlertTriangle size={18} />
          <p>Couldn’t load {title.toLowerCase()}.</p>
          <button type="button" onClick={state.reload}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : (
        state.data !== null && children(state.data)
      )}
    </section>
  );
}

// ---------- KPI card ----------
function KpiCard({
  label,
  icon: Icon,
  state,
  format,
  to,
  note,
  invertDelta,
  hero,
}: {
  label: string;
  icon: React.ElementType;
  state: WidgetState<Kpi>;
  format: (n: number) => string;
  to: string;
  note?: string;
  invertDelta?: boolean;
  hero?: boolean;
}) {
  const cls = `dash-stat${hero ? ' dash-stat--hero' : ''}`;
  const body = (
    <>
      <div className="dash-stat__top">
        <span className="dash-stat__icon">
          <Icon size={16} />
        </span>
        <span className="dash-stat__label">{label}</span>
      </div>
      {state.error ? (
        <>
          <p className="dash-stat__value">—</p>
          <button
            type="button"
            className="dash-retry"
            onClick={(e) => {
              e.preventDefault();
              state.reload();
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </>
      ) : state.data ? (
        <>
          <p className="dash-stat__value">{format(state.data.value)}</p>
          {state.data.deltaPct !== null ? (
            <p
              className={`dash-stat__delta ${
                (state.data.deltaPct >= 0) !== Boolean(invertDelta) ? 'is-good' : 'is-bad'
              }`}
            >
              <b>
                {state.data.deltaPct >= 0 ? '▲' : '▼'} {Math.abs(state.data.deltaPct).toFixed(1)}%
              </b>
              <span>vs previous</span>
            </p>
          ) : (
            <p className="dash-stat__delta dash-stat__delta--muted">{note}</p>
          )}
        </>
      ) : (
        <div className="dash-skeleton dash-skeleton--kpi" aria-busy="true" />
      )}
    </>
  );
  return (
    <Link to={to} className={`${cls} dash-stat--link`} aria-label={`${label}: open page`}>
      {body}
    </Link>
  );
}

// ---------- chart sizing: measure the container so text stays readable on phones ----------
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(Math.round(el.getBoundingClientRect().width));
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

function niceMax(v: number) {
  const p = 10 ** Math.floor(Math.log10(v));
  const m = v / p;
  return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p;
}

/**
 * Line / bar trend chart. Tap or drag on it (or hover with a mouse) to read a value —
 * SVG <title> tooltips don't exist on touch screens, so the value shows in a readout above the plot.
 */
function TrendChart({
  points,
  fmt,
  axisFmt,
  kind,
  noun,
}: {
  points: Point[];
  fmt: (n: number) => string;
  axisFmt: (n: number) => string;
  kind: 'line' | 'bar';
  noun: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const w = width || 320;
  const compact = w < 480;
  const h = compact ? 188 : 220;
  const pad = { l: compact ? 42 : 54, r: 10, t: 10, b: 24 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const n = points.length;
  const max = niceMax(Math.max(...points.map((p) => p.value), 1));
  const total = points.reduce((s, p) => s + p.value, 0);

  const x = (i: number) =>
    kind === 'bar' ? pad.l + ((i + 0.5) * iw) / n : pad.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v: number) => pad.t + (1 - v / max) * ih;

  const ticks = compact ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1];
  const labelCount = Math.min(compact ? 3 : 5, n);
  const labelIdx = [...new Set(Array.from({ length: labelCount }, (_, k) => Math.round((k * (n - 1)) / Math.max(labelCount - 1, 1))))];

  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const i = kind === 'bar' ? Math.floor(((px - pad.l) / iw) * n) : Math.round(((px - pad.l) / iw) * (n - 1));
    setActive(Math.min(Math.max(i, 0), n - 1));
  };

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L${x(n - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`;
  const bw = Math.max((iw / n) * 0.66, 2);
  const sel = active !== null ? points[active] : null;

  return (
    <div ref={ref}>
      <div className="dash-readout" aria-live="polite">
        {sel ? (
          <>
            <strong>{fmt(sel.value)}</strong>
            <span>{sel.label}</span>
          </>
        ) : (
          <>
            <strong>{fmt(total)}</strong>
            <span>total {noun} · tap the chart for detail</span>
          </>
        )}
      </div>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="dash-svg"
        role="img"
        aria-label={`${noun} ${kind} chart, ${n} points`}
        onPointerDown={pick}
        onPointerMove={pick}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={y(max * t)} y2={y(max * t)} className="dash-grid" />
            <text x={pad.l - 6} y={y(max * t) + 4} textAnchor="end" className="dash-axis">
              {axisFmt(max * t)}
            </text>
          </g>
        ))}
        {labelIdx.map((i, k) => (
          <text
            key={i}
            x={x(i)}
            y={h - 6}
            textAnchor={k === 0 && labelIdx.length > 1 ? 'start' : k === labelIdx.length - 1 && labelIdx.length > 1 ? 'end' : 'middle'}
            className="dash-axis"
          >
            {points[i].label}
          </text>
        ))}
        {kind === 'line' ? (
          <>
            <path d={area} className="dash-area" />
            <path d={line} className="dash-line" />
            {active !== null && (
              <>
                <line x1={x(active)} x2={x(active)} y1={pad.t} y2={pad.t + ih} className="dash-guide" />
                <circle cx={x(active)} cy={y(points[active].value)} r={5} className="dash-dot" />
              </>
            )}
          </>
        ) : (
          points.map((p, i) => (
            <rect
              key={i}
              x={x(i) - bw / 2}
              y={y(p.value)}
              width={bw}
              height={Math.max(pad.t + ih - y(p.value), 0)}
              rx={2}
              className={`dash-bar${active === i ? ' is-active' : ''}${active !== null && active !== i ? ' is-dim' : ''}`}
            />
          ))
        )}
      </svg>
    </div>
  );
}

// ---------- category + funnel ----------
function CategoryBars({ rows }: { rows: Point[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="dash-hbars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="dash-hbars__label">{r.label}</span>
          <span className="dash-hbars__value">
            {num(r.value)} <small>{((r.value / total) * 100).toFixed(0)}%</small>
          </span>
          <span className="dash-hbars__track">
            <span style={{ width: `${(r.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = steps[0]?.value || 1;
  const conv = (i: number) => (steps[i - 1].value ? (steps[i].value / steps[i - 1].value) * 100 : 0);
  // Biggest step-to-step drop is the most useful thing to see at a glance.
  let worst = -1;
  for (let i = 1; i < steps.length; i++) if (worst < 0 || conv(i) < conv(worst)) worst = i;
  return (
    <>
      <ul className="dash-funnel">
        {steps.map((s, i) => (
          <li key={s.label}>
            <span className="dash-funnel__label">{s.label}</span>
            <span className="dash-funnel__num">
              {num(s.value)}
              {i > 0 && <small className={i === worst ? 'is-worst' : ''}>{conv(i).toFixed(0)}%</small>}
            </span>
            <span className="dash-funnel__track">
              <span style={{ width: `${Math.max((s.value / top) * 100, 2)}%` }} />
            </span>
          </li>
        ))}
      </ul>
      {worst > 0 && (
        <p className="dash-funnel__note">
          Biggest drop: {steps[worst - 1].label} → {steps[worst].label} ({(100 - conv(worst)).toFixed(0)}% lost)
        </p>
      )}
    </>
  );
}

// ---------- operational snapshot ----------
const SNAP_ICONS: Record<string, React.ElementType> = {
  approvals: ShieldCheck,
  tickets: Headset,
  payouts: Wallet,
  refunds: RotateCcw,
};

function SnapshotTile({ item }: { item: SnapshotItem }) {
  const Icon = SNAP_ICONS[item.key] ?? ShieldCheck;
  const alert = item.alert && item.value > 0;
  return (
    <Link to={item.to} className={`dash-tile${alert ? ' is-alert' : ''}`}>
      <span className="dash-tile__icon">
        <Icon size={18} />
      </span>
      <span className="dash-tile__text">
        <span className="dash-tile__label">{item.label}</span>
        {item.amount !== undefined && item.value > 0 && <small>{inr(item.amount)} waiting</small>}
      </span>
      <strong className="dash-tile__count">{item.value}</strong>
      <ChevronRight size={16} className="dash-tile__chev" aria-hidden="true" />
    </Link>
  );
}

// ---------- filters ----------
type Preset = 'today' | '7d' | '30d' | '90d' | 'custom';
type Range = { from: string; to: string };
const PRESETS: { key: Preset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'custom', label: 'Custom' },
];

function rangeFor(preset: Exclude<Preset, 'custom'>): Range {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - ({ today: 0, '7d': 6, '30d': 29, '90d': 89 } as const)[preset]);
  return { from: toISO(from), to: toISO(to) };
}

function validateRange(preset: Preset, custom: Range): string {
  if (preset !== 'custom') return '';
  if (!custom.from || !custom.to) return 'Pick both dates.';
  if (custom.from > custom.to) return 'Start date must be before end date.';
  if (dayDiff(custom.from, custom.to) > 365) return 'Range can be at most 1 year.';
  return '';
}

/** Bottom sheet used on phones. Edits a draft; nothing changes on the dashboard until Apply. */
function FilterSheet({
  initial,
  onApply,
  onClose,
}: {
  initial: { preset: Preset; custom: Range; city: string };
  onApply: (v: { preset: Preset; custom: Range; city: string }) => void;
  onClose: () => void;
}) {
  const [preset, setPreset] = useState(initial.preset);
  const [custom, setCustom] = useState(initial.custom);
  const [city, setCity] = useState(initial.city);
  const dialogRef = useRef<HTMLDivElement>(null);
  const error = validateRange(preset, custom);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const f = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input, [tabindex="0"]');
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="dash-sheet-root">
      <div className="dash-sheet-backdrop" onClick={onClose} />
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Filters" className="dash-sheet">
        <div className="dash-sheet__grab" aria-hidden="true" />
        <div className="dash-sheet__head">
          <h2>Filters</h2>
          <button type="button" className="dash-icon-btn" onClick={onClose} aria-label="Close filters">
            <X size={18} />
          </button>
        </div>

        <div className="dash-sheet__body">
          <p className="dash-sheet__label">Date range</p>
          <div className="dash-chipgrid" role="group" aria-label="Date range">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={preset === p.key ? 'is-active' : ''}
                aria-pressed={preset === p.key}
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="dash-sheet__dates">
              <label>
                <span>From</span>
                <input
                  type="date"
                  value={custom.from}
                  max={custom.to || undefined}
                  onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
                />
              </label>
              <label>
                <span>To</span>
                <input
                  type="date"
                  value={custom.to}
                  min={custom.from || undefined}
                  onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
                />
              </label>
              {error && (
                <p className="dash-inline-error" role="alert">
                  <XCircle size={14} /> {error}
                </p>
              )}
            </div>
          )}

          <p className="dash-sheet__label">City</p>
          <div className="dash-chipgrid" role="radiogroup" aria-label="City">
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={city === c}
                className={city === c ? 'is-active' : ''}
                onClick={() => setCity(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="dash-sheet__foot">
          <button
            type="button"
            className="dash-btn dash-btn--ghost"
            onClick={() => {
              setPreset('30d');
              setCustom(rangeFor('30d'));
              setCity(ALL_CITIES);
            }}
          >
            Reset
          </button>
          <button
            type="button"
            className="dash-btn dash-btn--primary"
            disabled={Boolean(error)}
            onClick={() => onApply({ preset, custom, city })}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- page ----------
export const AdminDashboardPage: React.FC = () => {
  const [params] = useSearchParams();
  // Demo of partial failure: /admin?fail=revenue,funnel  (keys: gmv, bookings, cancellation, customers,
  // partners, snapshot, revenue, bookingChart, category, funnel)
  const failKey = params.get('fail') ?? '';
  const fail = useMemo(() => (failKey ? failKey.split(',') : []), [failKey]);

  const [preset, setPreset] = useState<Preset>('30d');
  const [custom, setCustom] = useState<Range>(() => rangeFor('30d'));
  const [city, setCity] = useState(ALL_CITIES);
  const [sheetOpen, setSheetOpen] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);

  const customError = validateRange(preset, custom);

  // Keep showing the last valid range while the custom dates are invalid.
  const lastValid = useRef(rangeFor('30d'));
  if (preset !== 'custom') lastValid.current = rangeFor(preset);
  else if (!customError) lastValid.current = custom;

  const filters: DashboardFilters = useMemo(
    () => ({ from: lastValid.current.from, to: lastValid.current.to, city }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preset, custom.from, custom.to, customError, city],
  );
  const deps = [filters.from, filters.to, filters.city, failKey];

  const gmv = useWidget(() => dashboardApi.gmv(filters, fail), deps);
  const bookings = useWidget(() => dashboardApi.bookings(filters, fail), deps);
  const cancellation = useWidget(() => dashboardApi.cancellation(filters, fail), deps);
  const customers = useWidget(() => dashboardApi.customers(fail), [failKey]);
  const partners = useWidget(() => dashboardApi.partners(fail), [failKey]);
  const snapshot = useWidget(() => dashboardApi.snapshot(filters, fail), [filters.city, failKey]);
  const revenue = useWidget(() => dashboardApi.revenueSeries(filters, fail), deps);
  const bookingChart = useWidget(() => dashboardApi.bookingSeries(filters, fail), deps);
  const category = useWidget(() => dashboardApi.categories(filters, fail), deps);
  const funnel = useWidget(() => dashboardApi.funnel(filters, fail), deps);

  const all = [gmv, bookings, cancellation, customers, partners, snapshot, revenue, bookingChart, category, funnel];
  const failed = all.filter((w) => w.error).length;
 

  const presetLabel = PRESETS.find((p) => p.key === preset)?.label ?? '';
  const rangeLabel =
    filters.from === filters.to ? shortDate(filters.from) : `${shortDate(filters.from)} – ${shortDate(filters.to)}`;
  const chipLabel = preset === 'custom' ? rangeLabel : presetLabel;

  const closeSheet = () => {
    setSheetOpen(false);
    chipRef.current?.focus();
  };

  return (
    <div className="admin-page-container p-6 dash">
      <div className="dash-head">
        <div className="dash-head__row">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
         
        </div>

        {/* desktop / tablet: inline controls */}
        <div className="dash-filters dash-filters--inline">
          <div className="dash-seg" role="group" aria-label="Date range">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                type="button"
                className={preset === p.key ? 'is-active' : ''}
                aria-pressed={preset === p.key}
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === 'custom' && (
            <div className="dash-custom">
              <input
                type="date"
                aria-label="Start date"
                value={custom.from}
                max={custom.to || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))}
              />
              <span>to</span>
              <input
                type="date"
                aria-label="End date"
                value={custom.to}
                min={custom.from || undefined}
                onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))}
              />
            </div>
          )}

          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City" className="dash-city">
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* phone: two compact chips that open the filter sheet */}
        <div className="dash-chips">
          <button
            ref={chipRef}
            type="button"
            className="dash-chip"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-label={`Date range: ${chipLabel}. Change filters`}
          >
            <CalendarDays size={16} />
            <span>{chipLabel}</span>
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="dash-chip"
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            aria-label={`City: ${city}. Change filters`}
          >
            <MapPin size={16} />
            <span>{city}</span>
            <ChevronDown size={14} />
          </button>
        </div>
        <p className="dash-range">
          {rangeLabel} · compared with the {dayDiff(filters.from, filters.to) + 1}-day period before
        </p>
      </div>

      {customError && (
        <p className="dash-inline-error dash-inline-error--page" role="alert">
          <XCircle size={14} /> {customError} Showing {filters.from} to {filters.to}.
        </p>
      )}
      {failed > 0 && (
        <p className="dash-banner" role="status">
          <AlertTriangle size={14} /> {failed} {failed === 1 ? 'widget' : 'widgets'} couldn’t load. The rest of the
          dashboard is still up to date.
        </p>
      )}

      <div className="dash-stats">
        <KpiCard hero label="GMV" icon={Banknote} state={gmv} format={inr} to="/admin/payments" />
        <KpiCard label="Bookings" icon={CalendarCheck} state={bookings} format={num} to="/admin/bookings" />
        <KpiCard
          label="Active customers"
          icon={Users}
          state={customers}
          format={num}
          to="/admin/customers"
          note="Not date-filtered"
        />
        <KpiCard
          label="Active partners"
          icon={HardHat}
          state={partners}
          format={num}
          to="/admin/manage-partners"
          note="Not date-filtered"
        />
        <KpiCard
          label="Cancellation rate"
          icon={XCircle}
          state={cancellation}
          format={(n) => `${n.toFixed(1)}%`}
          to="/admin/bookings"
          invertDelta
        />
      </div>

      <Widget title="Needs attention" state={snapshot} className="dash-snapshot-card">
        {(items: SnapshotItem[]) => (
          <div className="dash-snapshot">
            {items.map((it) => (
              <SnapshotTile key={it.key} item={it} />
            ))}
          </div>
        )}
      </Widget>

      <div className="dash-charts">
        <Widget title="Revenue" state={revenue}>
          {(pts: Point[]) => <TrendChart points={pts} fmt={inr} axisFmt={inrAxis} kind="line" noun="revenue" />}
        </Widget>
        <Widget title="Bookings" state={bookingChart}>
          {(pts: Point[]) => <TrendChart points={pts} fmt={num} axisFmt={numAxis} kind="bar" noun="bookings" />}
        </Widget>
        <Widget title="Bookings by category" state={category}>
          {(rows: Point[]) => <CategoryBars rows={rows} />}
        </Widget>
        <Widget title="Booking funnel" state={funnel}>
          {(steps: FunnelStep[]) => <Funnel steps={steps} />}
        </Widget>
      </div>

      {sheetOpen && (
        <FilterSheet
          initial={{ preset, custom, city }}
          onClose={closeSheet}
          onApply={(v) => {
            setPreset(v.preset);
            setCustom(v.custom);
            setCity(v.city);
            closeSheet();
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
