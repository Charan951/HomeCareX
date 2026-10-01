import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BlackoutDate,
  listBlackouts,
  createBlackout,
  updateBlackout,
  deleteBlackout,
} from './blackout.api';
import '../Availability/Availability.css';
import './BlackoutDates.css';

interface ApiErr { message: string }

const pad = (n: number) => String(n).padStart(2, '0');

/** Today in the user's local time (toISOString would use UTC and can be a day off in India before 5:30 AM). */
const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
};

const daysUntil = (d: string): number => {
  const [y, m, day] = d.split('-').map(Number);
  const now = new Date();
  const a = new Date(y, m - 1, day).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((a - b) / 86400000);
};

const whenLabel = (n: number): string =>
  n < 0 ? 'Past' : n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `In ${n} days`;

const fmtDate = (d: string): string =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });

const dayNum = (d: string) => d.slice(8, 10);
const monShort = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short' }).toUpperCase();

const bySortDate = (a: BlackoutDate, b: BlackoutDate) => a.date.localeCompare(b.date);

/** Counts smoothly from the previous value to the new one. */
const Tween: React.FC<{ value: number }> = ({ value }) => {
  const [shown, setShown] = useState(0);
  const cur = useRef(0);
  useEffect(() => {
    const from = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - t0) / 500, 1);
      const v = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 3)));
      cur.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{shown}</>;
};

const IconCalendar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconNote = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M15 3v5h5M8 13h8M8 17h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 20h4L18 9l-4-4L4 16v4z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);
const IconBlock = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" />
    <path d="M5.6 5.6l12.8 12.8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

export const PartnerBlackoutDatesPage: React.FC = () => {
  const [items, setItems] = useState<BlackoutDate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false); // shows the green "Added" tick briefly
  const [errKey, setErrKey] = useState(0);   // replays the shake on each new form error

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [newId, setNewId] = useState<string | null>(null);     // card that just landed
  const [leavingId, setLeavingId] = useState<string | null>(null); // card animating out

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBlackouts();
      setItems(data.slice().sort(bySortDate));
    } catch (e) {
      setError((e as ApiErr).message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fail = (msg: string) => {
    setFormError(msg);
    setErrKey((k) => k + 1);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!date) return fail('Pick a date');
    if (date < todayStr()) return fail('Cannot add a blackout date in the past');
    if (!reason.trim()) return fail('Add a short reason');
    setAdding(true);
    try {
      const created = await createBlackout(date, reason.trim());
      setItems((prev) => [...(prev ?? []), created].sort(bySortDate));
      setNewId(created._id);
      setTimeout(() => setNewId((cur) => (cur === created._id ? null : cur)), 2200);
      setDate('');
      setReason('');
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    } catch (e) {
      fail((e as ApiErr).message ?? 'Could not add that date');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (item: BlackoutDate) => {
    setConfirmDeleteId(null);
    setEditingId(item._id);
    setEditReason(item.reason);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    if (!editReason.trim()) return;
    setRowBusy(id);
    try {
      const updated = await updateBlackout(id, editReason.trim());
      setItems((prev) => prev && prev.map((i) => (i._id === id ? updated : i)));
      setEditingId(null);
      setNewId(id); // reuse the glow so the edited card flashes once
      setTimeout(() => setNewId((cur) => (cur === id ? null : cur)), 1600);
    } catch (e) {
      setError((e as ApiErr).message ?? 'Could not save that change');
    } finally {
      setRowBusy(null);
    }
  };

  const remove = async (id: string) => {
    setRowBusy(id);
    try {
      await deleteBlackout(id);
      setLeavingId(id);
      setTimeout(() => {
        setItems((prev) => prev && prev.filter((i) => i._id !== id));
        setLeavingId(null);
      }, 380);
    } catch (e) {
      setError((e as ApiErr).message ?? 'Could not remove that date');
    } finally {
      setRowBusy(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return (
      <div className="pa-page bd-page" aria-busy="true">
        <div className="bd-skel bd-skel-head" />
        <div className="bd-layout">
          <div className="bd-skel bd-skel-form" />
          <div className="bd-right">
            <div className="bd-skel bd-skel-pill" />
            <div className="bd-list">
              {[0, 1, 2, 3].map((i) => <div key={i} className="bd-skel bd-skel-card" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const count = items?.length ?? 0;
  const next = items?.find((i) => daysUntil(i.date) >= 0);

  return (
    <div className="pa-page bd-page">
      <div className="bd-header">
        <Link className="bd-back" to="/partner/availability" aria-label="Back to availability">&larr;</Link>
        <div>
          <h1 className="pa-title bd-h1">Blackout Dates</h1>
          <p className="bd-page-sub">Days you're unavailable for new jobs</p>
        </div>
      </div>

      {error && <p className="pa-error bd-alert" role="alert">{error}</p>}

      <div className="bd-layout">
        <form className="bd-form" onSubmit={add} noValidate>
          <div className="bd-form-badge" aria-hidden="true"><IconBlock /></div>
          <h2 className="bd-form-title">Add a blackout date</h2>
          <p className="bd-form-sub">You won't receive job offers on this day.</p>

          <label className="bd-field">
            <span><IconCalendar /> Date</span>
            <input
              type="date"
              value={date}
              min={todayStr()}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="bd-field">
            <span><IconNote /> Reason</span>
            <input
              type="text"
              value={reason}
              maxLength={200}
              placeholder="e.g. Family event"
              onChange={(e) => setReason(e.target.value)}
            />
          </label>

          {formError && (
            <p key={errKey} className="pa-error bd-form-err" role="alert">{formError}</p>
          )}

          <button className={`pa-btn bd-submit ${added ? 'bd-submit-ok' : ''}`} type="submit" disabled={adding}>
            {adding ? (
              <><span className="bd-spin" aria-hidden="true" /> Adding...</>
            ) : added ? (
              <>
                <svg className="bd-check" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>{' '}
                Added
              </>
            ) : (
              <><IconPlus /> Add date</>
            )}
          </button>
        </form>

        <div className="bd-right">
          <div className="bd-count-row">
            <span className="bd-count-label">
              {count === 0 ? 'No blackout dates' : (
                <><span className="bd-count-num"><Tween value={count} /></span> blackout {count === 1 ? 'date' : 'dates'}</>
              )}
            </span>
            {next && (
              <span className="bd-next" key={next._id}>
                <span className="bd-next-dot" aria-hidden="true" />
                Next: {fmtDate(next.date)} &middot; {whenLabel(daysUntil(next.date))}
              </span>
            )}
          </div>

          {count === 0 ? (
            <div className="bd-empty">
              <div className="bd-empty-icon" aria-hidden="true">🗓️</div>
              <p className="bd-empty-title">Nothing blocked off yet</p>
              <p className="pa-muted">Add a date on the left to keep it free of job offers.</p>
            </div>
          ) : (
            <ul className="bd-list">
              {items!.map((item, i) => {
                const isEditing = editingId === item._id;
                const isConfirming = confirmDeleteId === item._id;
                const busy = rowBusy === item._id;
                const n = daysUntil(item.date);
                const cls = [
                  'bd-card',
                  isConfirming ? 'bd-card-danger' : '',
                  newId === item._id ? 'bd-card-new' : '',
                  leavingId === item._id ? 'bd-card-leave' : '',
                ].join(' ');
                return (
                  <li key={item._id} className={cls} style={{ '--i': i } as React.CSSProperties}>
                    <div className="bd-row">
                      <div className={`bd-datechip ${n === 0 ? 'bd-datechip-today' : ''}`} aria-hidden="true">
                        <span className="bd-datechip-mon">{monShort(item.date)}</span>
                        <span className="bd-datechip-day">{dayNum(item.date)}</span>
                      </div>

                      <div className="bd-info">
                        <span className="bd-date">{fmtDate(item.date)}</span>
                        {isEditing ? (
                          <input
                            className="bd-edit-input"
                            value={editReason}
                            maxLength={200}
                            autoFocus
                            onChange={(e) => setEditReason(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(item._id);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            aria-label={`Reason for ${item.date}`}
                          />
                        ) : (
                          <span className="bd-reason">{item.reason}</span>
                        )}
                      </div>

                      <span className={`bd-when ${n === 0 ? 'bd-when-now' : ''} ${n < 0 ? 'bd-when-past' : ''}`}>
                        {whenLabel(n)}
                      </span>
                    </div>

                    <div className="bd-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="bd-btn bd-btn-primary"
                            onClick={() => saveEdit(item._id)}
                            disabled={busy || !editReason.trim()}
                          >
                            {busy ? 'Saving...' : 'Save'}
                          </button>
                          <button type="button" className="bd-btn bd-btn-ghost" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </>
                      ) : isConfirming ? (
                        <>
                          <span className="bd-confirm-text">Remove this date?</span>
                          <button
                            type="button"
                            className="bd-btn bd-btn-danger"
                            onClick={() => remove(item._id)}
                            disabled={busy}
                          >
                            {busy ? 'Removing...' : 'Yes, remove'}
                          </button>
                          <button
                            type="button"
                            className="bd-btn bd-btn-ghost"
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="bd-btn bd-btn-outline" onClick={() => startEdit(item)}>
                            <IconEdit /> Edit
                          </button>
                          <button
                            type="button"
                            className="bd-btn bd-btn-outline bd-btn-danger-outline"
                            onClick={() => { setEditingId(null); setConfirmDeleteId(item._id); }}
                          >
                            <IconTrash /> Remove
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerBlackoutDatesPage;