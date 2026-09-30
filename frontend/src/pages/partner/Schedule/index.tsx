import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSchedule, Schedule as ScheduleData, ScheduleJob } from './schedule.api';
import '../Availability/Availability.css';
import './Schedule.css';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Kind = 'working' | 'off' | 'blackout';
type Dir = 'next' | 'prev';

const pad = (n: number) => String(n).padStart(2, '0');
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayStr = () => {
  const n = new Date();
  return toStr(n.getFullYear(), n.getMonth(), n.getDate());
};
const dayNameOf = (s: string) => DAY_NAMES[new Date(`${s}T00:00:00Z`).getUTCDay()];
const monthLabel = (y: number, m: number) =>
  new Date(Date.UTC(y, m, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
const weekdayOf = (s: string) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'long', timeZone: 'UTC' });
const dayMonthYear = (s: string) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const longDate = (s: string) => `${weekdayOf(s)}, ${dayMonthYear(s)}`;

const useCountUp = (target: number) => {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / 600, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
};

const Stat: React.FC<{ label: string; value: number; tone: Kind; delay: number }> = ({ label, value, tone, delay }) => {
  const n = useCountUp(value);
  return (
    <div className={`sc-stat sc-stat-${tone} sc-rise`} style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <span className="sc-stat-num">{n}</span>
      <span className="sc-stat-label">{label}</span>
    </div>
  );
};

export const PartnerSchedulePage: React.FC = () => {
  const now = new Date();
  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [dir, setDir] = useState<Dir>('next');
  const [selected, setSelected] = useState<string>(todayStr());
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (y: number, m: number) => {
    setLoading(true);
    setError(null);
    try {
      const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      setData(await getSchedule(toStr(y, m, 1), toStr(y, m, last)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(view.y, view.m); }, [view, load]);

  const goTo = (y: number, m: number, d: Dir = 'next') => {
    const t = todayStr();
    const first = toStr(y, m, 1);
    setSelected(t.startsWith(first.slice(0, 7)) ? t : first);
    setDir(d);
    setView({ y, m });
  };
  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    goTo(d.getFullYear(), d.getMonth(), delta > 0 ? 'next' : 'prev');
  };

  const blackoutByDate = useMemo(
    () => new Map((data?.blackoutDates ?? []).map((b) => [b.date, b])),
    [data]
  );
  const jobsByDate = useMemo(() => {
    const map = new Map<string, ScheduleJob[]>();
    (data?.jobs ?? []).forEach((j) => map.set(j.date, [...(map.get(j.date) ?? []), j]));
    return map;
  }, [data]);

  const describe = (date: string) => {
    const blackout = blackoutByDate.get(date);
    const wd = data?.workingHours.find((d) => d.day === dayNameOf(date));
    const kind: Kind = blackout ? 'blackout' : !wd || wd.off ? 'off' : 'working';
    return { kind, blackout, wd };
  };

  if (!data && loading) {
    return (
      <div className="sc-root" aria-busy="true">
        <div className="sc-skeleton" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="sc-root">
        <h1 className="pa-title">Schedule</h1>
        <p className="pa-error" role="alert">{error ?? 'No schedule found.'}</p>
        <button className="pa-btn" onClick={() => load(view.y, view.m)}>Try again</button>
      </div>
    );
  }

  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const lead = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
  const cells: (number | null)[] = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = todayStr();
  const sel = describe(selected);
  const selJobs = jobsByDate.get(selected) ?? [];

  const counts = { working: 0, off: 0, blackout: 0 };
  for (let d = 1; d <= daysInMonth; d++) counts[describe(toStr(view.y, view.m, d)).kind]++;

  return (
    <div className="sc-root">
      <div className="sc-top sc-rise" style={{ '--d': '0ms' } as React.CSSProperties}>
        <div className="wh-header">
          <Link className="wh-back" to="/partner/availability" aria-label="Back to availability">&larr;</Link>
          <div>
            <h1 className="pa-title wh-h1">Schedule</h1>
            <p className="bd-page-sub">Your working days, blackouts and jobs</p>
          </div>
        </div>
        <span className={`sc-online ${data.isOnline ? 'sc-online-on' : ''}`}>
          <span className="sc-online-dot" aria-hidden="true" />
          {data.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {error && <p className="pa-error" role="alert">{error}</p>}

      <div className="sc-stats">
        <Stat label="Working days" value={counts.working} tone="working" delay={80} />
        <Stat label="Days off" value={counts.off} tone="off" delay={160} />
        <Stat label="Blackouts" value={counts.blackout} tone="blackout" delay={240} />
      </div>

      <div className="sc-layout">
        <section className="sc-cal sc-rise" style={{ '--d': '300ms' } as React.CSSProperties} aria-label="Monthly calendar">
          <div className="sc-cal-head">
            <button className="sc-nav" onClick={() => shift(-1)} aria-label="Previous month">&lsaquo;</button>
            <h2 className="sc-month" key={`${view.y}-${view.m}`}>{monthLabel(view.y, view.m)}</h2>
            <button className="sc-nav" onClick={() => shift(1)} aria-label="Next month">&rsaquo;</button>
            <button
              className="sc-today"
              onClick={() => {
                const n = new Date();
                goTo(n.getFullYear(), n.getMonth());
                setSelected(todayStr());
              }}
            >
              Today
            </button>
          </div>

          <div className="sc-weekdays" aria-hidden="true">
            {WEEKDAYS.map((w) => <span key={w}>{w}</span>)}
          </div>

          <div
            className={`sc-grid sc-in-${dir} ${loading ? 'sc-grid-loading' : ''}`}
            key={`${view.y}-${view.m}`}
          >
            {cells.map((d, i) => {
              if (d === null) return <span key={`b${i}`} className="sc-cell sc-cell-blank" aria-hidden="true" />;
              const date = toStr(view.y, view.m, d);
              const { kind, wd } = describe(date);
              const jobs = jobsByDate.get(date)?.length ?? 0;
              const cls = [
                'sc-cell', `sc-${kind}`,
                date === today ? 'sc-is-today' : '',
                date === selected ? 'sc-is-selected' : '',
              ].join(' ');
              return (
                <button
                  key={date}
                  className={cls}
                  style={{ '--i': i } as React.CSSProperties}
                  onClick={() => setSelected(date)}
                  aria-pressed={date === selected}
                  aria-label={`${longDate(date)}, ${kind === 'working' ? 'working' : kind === 'off' ? 'day off' : 'blackout'}`}
                >
                  <span className="sc-num">{d}</span>
                  <span className="sc-tag">
                    {kind === 'working' && wd ? `${wd.start}-${wd.end}` : kind === 'blackout' ? 'Blackout' : 'Off'}
                  </span>
                  {jobs > 0 && <span className="sc-jobs-dot" title={`${jobs} job(s)`} />}
                </button>
              );
            })}
          </div>

          <ul className="sc-legend">
            <li><i className="sc-key sc-key-working" />Working</li>
            <li><i className="sc-key sc-key-off" />Day off</li>
            <li><i className="sc-key sc-key-blackout" />Blackout</li>
          </ul>
        </section>

        <aside className={`sc-panel sc-panel-${sel.kind}`} key={selected} aria-live="polite">
          <div className="sc-panel-head">
            <p className="sc-panel-weekday">{weekdayOf(selected)}</p>
            <p className="sc-panel-date">{dayMonthYear(selected)}</p>
            <span className="sc-badge">
              {sel.kind === 'working' && sel.wd ? `${sel.wd.start} - ${sel.wd.end}` : sel.kind === 'blackout' ? 'Blackout' : 'Day off'}
            </span>
          </div>

          <div className="sc-panel-body">
            {sel.kind === 'blackout' && <p className="sc-panel-text">{sel.blackout?.reason}</p>}
            {sel.kind === 'off' && <p className="sc-muted">Not part of your weekly working hours.</p>}
            {sel.kind === 'working' && <p className="sc-muted">Working day</p>}

            <h3 className="sc-panel-sub">Jobs</h3>
            {selJobs.length > 0 ? (
              <ul className="sc-job-list">
                {selJobs.map((j, i) => (
                  <li key={j.id} className="sc-job" style={{ '--i': i } as React.CSSProperties}>
                    <b>{j.start} - {j.end}</b>
                    <span>{j.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sc-muted">
                {sel.kind === 'working' ? 'No jobs scheduled for this day.' : 'No jobs on this day.'}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PartnerSchedulePage;