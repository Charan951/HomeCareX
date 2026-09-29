import React, { useEffect, useState } from 'react';
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

const dayError = (d: WorkingHoursDay): string | null =>
  !d.off && d.end <= d.start ? 'End time must be after start time' : null;

const duration = (d: WorkingHoursDay): number =>
  d.off || d.end <= d.start ? 0 : toMin(d.end) - toMin(d.start);

const fmtHours = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export const PartnerWorkingHoursPage: React.FC = () => {
  const [hours, setHours] = useState<WorkingHoursDay[] | null>(null);
  const [original, setOriginal] = useState<WorkingHoursDay[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAvailability()
      .then((a) => {
        setHours(a.workingHours);
        setOriginal(a.workingHours);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="pa-page" aria-busy="true">
        <p className="pa-muted">Loading working hours...</p>
      </div>
    );
  }

  if (!hours) {
    return (
      <div className="pa-page">
        <h1 className="pa-title">Working Hours</h1>
        <p className="pa-error" role="alert">{error ?? 'No working hours found.'}</p>
      </div>
    );
  }

  const workingDays = hours.filter((d) => !d.off).length;
  const totalMins = hours.reduce((sum, d) => sum + duration(d), 0);
  const monday = hours.find((d) => d.day === 'monday');

  return (
    <div className="pa-page wh-page">
      <div className="wh-header">
        <Link className="wh-back" to="/partner/availability" aria-label="Back to availability">
          &larr;
        </Link>
        <h1 className="pa-title wh-h1">Working Hours</h1>
      </div>

      <section className="wh-summary">
        <div>
          <span className="wh-big">{workingDays}</span>
          <span className="wh-cap">working days</span>
        </div>
        <div>
          <span className="wh-big">{fmtHours(totalMins)}</span>
          <span className="wh-cap">per week</span>
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

      {error && <p className="pa-error" role="alert">{error}</p>}
      {saved && <p className="wh-ok" role="status">Working hours saved</p>}

      <ul className="wh-list">
        {hours.map((d) => {
          const err = dayError(d);
          return (
            <li key={d.day} className={`wh-card ${d.off ? 'wh-card-off' : ''} ${err ? 'wh-card-bad' : ''}`}>
              <div className="wh-top">
                <span className="wh-badge" aria-hidden="true">{d.day.slice(0, 3)}</span>
                <div className="wh-name">
                  <span className="wh-day">{d.day}</span>
                  <span className="wh-sub">
                    {d.off ? 'Day off' : err ? 'Check times' : `${fmtHours(duration(d))} of work`}
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={!d.off}
                  aria-label={`${d.day} is a working day`}
                  className={`pa-switch wh-switch ${!d.off ? 'pa-on' : ''}`}
                  onClick={() => change(d.day, { off: !d.off })}
                >
                  <span className="pa-knob" />
                </button>
              </div>

              {!d.off && (
                <div className="wh-times">
                  <label>
                    From
                    <input
                      type="time"
                      value={d.start}
                      onChange={(e) => change(d.day, { start: e.target.value })}
                    />
                  </label>
                  <span className="wh-to" aria-hidden="true">to</span>
                  <label>
                    To
                    <input
                      type="time"
                      value={d.end}
                      aria-invalid={err ? true : undefined}
                      onChange={(e) => change(d.day, { end: e.target.value })}
                    />
                  </label>
                </div>
              )}

              {err && <p className="pa-error wh-err" role="alert">{err}</p>}
            </li>
          );
        })}
      </ul>

      <div className="wh-bar">
        <span className="wh-dirty">{dirty ? 'You have unsaved changes' : 'All changes saved'}</span>
        <button className="pa-btn" onClick={save} disabled={hasErrors || saving || !dirty}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </div>
  );
};

export default PartnerWorkingHoursPage;