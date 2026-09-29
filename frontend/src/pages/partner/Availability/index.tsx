import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Availability, getAvailability, setOnline } from './availability.api';
import { formatTime, todayName } from './time';
import './Availability.css';

export const PartnerAvailabilityPage: React.FC = () => {
  const [data, setData] = useState<Availability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getAvailability());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!data || saving) return;
    setSaving(true);
    setError(null);
    try {
      setData(await setOnline(!data.isOnline));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="pa-page" aria-busy="true">
        <p className="pa-muted">Loading availability...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pa-page">
        <h1 className="pa-title">Availability</h1>
        <p className="pa-error" role="alert">{error ?? 'No availability found.'}</p>
        <button className="pa-btn" onClick={load}>Try again</button>
      </div>
    );
  }

  const today = data.workingHours.find((d) => d.day === todayName());

  return (
    <div className="pa-page">
      <h1 className="pa-title">Availability</h1>

      {error && <p className="pa-error" role="alert">{error}</p>}

      <section className={`pa-status-card ${data.isOnline ? 'pa-status-on' : ''}`}>
        <div>
          <h2 className="pa-status">{data.isOnline ? 'Online' : 'Offline'}</h2>
          <p className="pa-muted">
            {data.isOnline ? 'You are visible to customers' : 'You are hidden from customers'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.isOnline}
          aria-label="Go online"
          className={`pa-switch ${data.isOnline ? 'pa-on' : ''}`}
          onClick={toggle}
          disabled={saving}
        >
          <span className="pa-knob" />
        </button>
      </section>
      <section className="pa-week">
        <span className="pa-label">This week</span>
        <div className="pa-chips">
          {data.workingHours.map((d) => (
            <span
              key={d.day}
              className={`pa-chip ${d.off ? 'pa-chip-off' : ''}`}
              title={d.off ? `${d.day}: off` : `${d.day}: working`}
            >
              {d.day.slice(0, 3)}
            </span>
          ))}
        </div>
      </section>

      <Link className="pa-link-row" to="/partner/working-hours">
        <span>
          <span className="pa-label">Working Hours (Today)</span>
          <span className="pa-value">
            {!today || today.off
              ? 'Off day'
              : `${formatTime(today.start)}  -  ${formatTime(today.end)}`}
          </span>
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </Link>
    </div>
  );
};

export default PartnerAvailabilityPage;