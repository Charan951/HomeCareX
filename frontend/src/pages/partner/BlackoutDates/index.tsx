import React, { useEffect, useState } from 'react';
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

const todayStr = () => new Date().toISOString().slice(0, 10);

const fmtDate = (d: string): string =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });

const dayNum = (d: string) => d.slice(8, 10);
const monShort = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: 'short' }).toUpperCase();

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

export const PartnerBlackoutDatesPage: React.FC = () => {
  const [items, setItems] = useState<BlackoutDate[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editReason, setEditReason] = useState('');
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listBlackouts();
      setItems(data.slice().sort((a, b) => a.date.localeCompare(b.date)));
    } catch (e) {
      setError((e as ApiErr).message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!date) return setFormError('Pick a date');
    if (date < todayStr()) return setFormError('Cannot add a blackout date in the past');
    if (!reason.trim()) return setFormError('Add a short reason');
    setAdding(true);
    try {
      const created = await createBlackout(date, reason.trim());
      setItems((prev) => [...(prev ?? []), created].sort((a, b) => a.date.localeCompare(b.date)));
      setDate('');
      setReason('');
    } catch (e) {
      setFormError((e as ApiErr).message ?? 'Could not add that date');
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
      setItems((prev) => prev && prev.filter((i) => i._id !== id));
    } catch (e) {
      setError((e as ApiErr).message ?? 'Could not remove that date');
    } finally {
      setRowBusy(null);
      setConfirmDeleteId(null);
    }
  };

  if (loading) {
    return <div className="pa-page" aria-busy="true"><p className="pa-muted">Loading blackout dates...</p></div>;
  }

  const count = items?.length ?? 0;

  return (
    <div className="pa-page bd-page">
      <div className="wh-header">
        <Link className="wh-back" to="/partner/availability" aria-label="Back to availability">&larr;</Link>
        <div>
          <h1 className="pa-title wh-h1">Blackout Dates</h1>
          <p className="bd-page-sub">Days you're unavailable for new jobs</p>
        </div>
      </div>

      {error && <p className="pa-error" role="alert">{error}</p>}

      <div className="bd-layout">
        <form className="bd-form" onSubmit={add}>
          <div className="bd-form-badge" aria-hidden="true">🚫</div>
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

          {formError && <p className="pa-error bd-form-err" role="alert">{formError}</p>}

          <button className="pa-btn bd-submit" type="submit" disabled={adding}>
            <IconPlus /> {adding ? 'Adding...' : 'Add date'}
          </button>
        </form>

        <div className="bd-right">
          <div className="bd-count-row">
            <span className="bd-count-label">
              {count === 0 ? 'No blackout dates' : `${count} blackout ${count === 1 ? 'date' : 'dates'}`}
            </span>
          </div>

          {count === 0 ? (
            <div className="bd-empty">
              <div className="bd-empty-icon" aria-hidden="true">🗓️</div>
              <p className="bd-empty-title">Nothing blocked off yet</p>
              <p className="pa-muted">Add a date on the left to keep it free of job offers.</p>
            </div>
          ) : (
            <ul className="bd-list">
              {items!.map((item) => {
                const isEditing = editingId === item._id;
                const isConfirming = confirmDeleteId === item._id;
                const busy = rowBusy === item._id;
                return (
                  <li key={item._id} className={`bd-card ${isConfirming ? 'bd-card-danger' : ''}`}>
                    <div className="bd-row">
                      <div className="bd-datechip" aria-hidden="true">
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
                            aria-label={`Reason for ${item.date}`}
                          />
                        ) : (
                          <span className="bd-reason">{item.reason}</span>
                        )}
                      </div>
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
                            onClick={() => setConfirmDeleteId(item._id)}
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