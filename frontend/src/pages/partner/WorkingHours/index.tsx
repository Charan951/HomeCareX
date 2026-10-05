import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getAvailability,
  setWorkingHours,
  WorkingHoursDay,
} from '../Availability/availability.api';
import '../Availability/Availability.css';
import './WorkingHours.css';

const toMin = (t: string): number => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const fmt12 = (t: string): string => {
  const [h, m] = t.split(':').map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
};

const dayError = (d: WorkingHoursDay): string | null =>
  !d.off && d.end <= d.start ? 'End time must be after start time' : null;

const duration = (d: WorkingHoursDay): number =>
  d.off || d.end <= d.start ? 0 : toMin(d.end) - toMin(d.start);

const fmtHours = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/** True on phone-sized screens (matches the CSS breakpoint). */
const useIsMobile = (): boolean => {
  const query = '(max-width: 699px)';
  const [mobile, setMobile] = useState<boolean>(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
};

/** Counts smoothly from the previous value to the new one. */
const Tween: React.FC<{ value: number; format?: (n: number) => string }> = ({ value, format }) => {
  const [shown, setShown] = useState(0);
  const cur = useRef(0);
  useEffect(() => {
    const from = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 600, 1);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      cur.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{format ? format(shown) : shown}</>;
};

const TICKS = ['12a', '6a', '12p', '6p', '12a'];

export const PartnerWorkingHoursPage: React.FC = () => {
  const mobile = useIsMobile();
  const [hours, setHours] = useState<WorkingHoursDay[] | null>(null);
  const [original, setOriginal] = useState<WorkingHoursDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [openDay, setOpenDay] = useState<string | null>(null); // mobile: which day's times are open
  const [flash, setFlash] = useState(0); // bumps on "Copy Monday to all" to replay the pulse

  useEffect(() => {
    getAvailability()
      .then((a) => {
        setHours(a.workingHours);
        setOriginal(a.workingHours);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  // "Saved" feedback fades after a moment.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  const change = (day: string, patch: Partial<WorkingHoursDay>) => {
    setSaved(false);
    setHours((h) => h && h.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  };

  const copyMonday = () => {
    if (!hours) return;
    const mon = hours.find((d) => d.day === 'monday');
    if (!mon || mon.off) return;
    setSaved(false);
    setHours(hours.map((d) => (d.off ? d : { ...d, start: mon.start, end: mon.end })));
    setFlash((f) => f + 1);
  };

  const hasErrors = hours ? hours.some((d) => dayError(d)) : false;
  const dirty = JSON.stringify(hours) !== JSON.stringify(original);

  const save = async () => {
    if (!hours || hasErrors || saving || !dirty) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await setWorkingHours(hours);
      setHours(updated.workingHours);
      setOriginal(updated.workingHours);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pa-page wh-page" aria-busy="true">
        <div className="wh-skel wh-skel-head" />
        <div className="wh-layout">
          <div className="wh-skel wh-skel-sum" />
          <div className="wh-list">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="wh-skel wh-skel-card" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hours) {
    return (
      <div className="pa-page wh-page">
        <h1 className="pa-title wh-h1">Working Hours</h1>
        <p className="pa-error" role="alert">{error ?? 'No working hours found.'}</p>
      </div>
    );
  }

  const workingDays = hours.filter((d) => !d.off).length;
  const totalMins = hours.reduce((sum, d) => sum + duration(d), 0);
  const monday = hours.find((d) => d.day === 'monday');
  const flashClass = flash === 0 ? '' : flash % 2 ? 'wh-flash-1' : 'wh-flash-2';
  const idle = !dirty && !saving && !saved; // on phones the save bar hides when there is nothing to save

  return (
    <div className="pa-page wh-page">
      <div className="wh-header">
        <Link className="wh-back" to="/partner/availability" aria-label="Back to availability">
          &larr;
        </Link>
        <div>
          <h1 className="pa-title wh-h1">Working Hours</h1>
          <p className="bd-page-sub">Set the days and times customers can book you</p>
        </div>
      </div>

      {error && <p className="pa-error" role="alert">{error}</p>}
      {saved && <p className="wh-ok" role="status">Working hours saved</p>}

      <div className="wh-layout">
        <section className="wh-summary">
          <div>
            <span className="wh-big"><Tween value={workingDays} /></span>
            <span className="wh-cap">working days</span>
          </div>
          <div>
            <span className="wh-big"><Tween value={totalMins} format={fmtHours} /></span>
            <span className="wh-cap">per week</span>
          </div>

          <div className="wh-bars" aria-hidden="true">
            {hours.map((d, i) => (
              <div key={d.day} className="wh-bars-col" style={{ '--i': i } as React.CSSProperties}>
                <div className="wh-bars-well">
                  <span
                    className="wh-bars-fill"
                    style={{ height: `${Math.min((duration(d) / (14 * 60)) * 100, 100)}%` }}
                  />
                </div>
                <span className="wh-bars-lbl">{d.day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="wh-copy"
            onClick={copyMonday}
            disabled={!monday || monday.off || !!(monday && dayError(monday))}
          >
            Copy Monday to all
          </button>
        </section>

        <ul className="wh-list">
          {hours.map((d, i) => {
            const err = dayError(d);
            const expanded = !d.off && (!mobile || openDay === d.day);
            const sub = d.off
              ? 'Day off'
              : err
                ? 'Check times'
                : mobile
                  ? `${fmt12(d.start)} – ${fmt12(d.end)} · ${fmtHours(duration(d))}`
                  : `${fmtHours(duration(d))} of work`;
            const nameText = (
              <>
                <span className="wh-day">{d.day}</span>
                <span className="wh-sub">{sub}</span>
              </>
            );
            return (
              <li
                key={d.day}
                className={`wh-card ${d.off ? 'wh-card-off' : flashClass} ${err ? 'wh-card-bad' : ''} ${
                  mobile && expanded ? 'wh-card-open' : ''
                }`}
                style={{ '--i': i } as React.CSSProperties}
              >
                <div className="wh-top">
                  <span className="wh-badge" aria-hidden="true">{d.day.slice(0, 3)}</span>

                  {mobile && !d.off ? (
                    <button
                      type="button"
                      className="wh-name wh-name-btn"
                      aria-expanded={expanded}
                      aria-controls={`wh-panel-${d.day}`}
                      onClick={() => setOpenDay((cur) => (cur === d.day ? null : d.day))}
                    >
                      <span className="wh-name-text">{nameText}</span>
                      <svg className="wh-chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ) : (
                    <div className="wh-name">{nameText}</div>
                  )}

                  <button
                    type="button"
                    role="switch"
                    aria-checked={!d.off}
                    aria-label={`${d.day} is a working day`}
                    className={`pa-switch wh-switch ${!d.off ? 'pa-on' : ''}`}
                    onClick={() => {
                      change(d.day, { off: !d.off });
                      if (d.off) setOpenDay(d.day); // turning a day on opens its times
                    }}
                  >
                    <span className="pa-knob" />
                  </button>
                </div>

                <div
                  id={`wh-panel-${d.day}`}
                  className={`wh-collapse ${expanded ? 'wh-open' : ''}`}
                  aria-hidden={!expanded}
                >
                  <div className="wh-collapse-inner">
                    <div className="wh-times">
                      <label>
                        From
                        <input
                          type="time"
                          value={d.start}
                          tabIndex={expanded ? undefined : -1}
                          onChange={(e) => change(d.day, { start: e.target.value })}
                        />
                      </label>
                      <span className="wh-to" aria-hidden="true">&rarr;</span>
                      <label>
                        To
                        <input
                          type="time"
                          value={d.end}
                          tabIndex={expanded ? undefined : -1}
                          aria-invalid={err ? true : undefined}
                          onChange={(e) => change(d.day, { end: e.target.value })}
                        />
                      </label>
                    </div>

                    {!err && (
                      <div aria-hidden="true">
                        <div className="wh-track" title="Position within the 24-hour day">
                          <span
                            key={String(d.off)}
                            style={{
                              left: `${(toMin(d.start) / 1440) * 100}%`,
                              width: `${(duration(d) / 1440) * 100}%`,
                            }}
                          />
                        </div>
                        <div className="wh-ticks">
                          {TICKS.map((t, k) => <span key={k}>{t}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {err && <p className="pa-error wh-err" role="alert">{err}</p>}
              </li>
            );
          })}
        </ul>
      </div>

      <div className={`wh-bar ${idle ? 'wh-bar-idle' : ''}`}>
        <span className={`wh-dirty ${dirty ? 'wh-dirty-on' : ''}`}>
          {dirty ? 'You have unsaved changes' : 'All changes saved'}
        </span>
        <button
          className={`pa-btn wh-save ${saved && !dirty ? 'wh-saved' : ''}`}
          onClick={save}
          disabled={hasErrors || saving || !dirty}
        >
          {saving ? (
            <><span className="wh-spin" aria-hidden="true" /> Saving...</>
          ) : saved && !dirty ? (
            <>
              <svg className="wh-check" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>{' '}
              Saved
            </>
          ) : (
            'Save changes'
          )}
        </button>
      </div>
    </div>
  );
};

export default PartnerWorkingHoursPage;