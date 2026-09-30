import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Availability, getAvailability, setOnline } from './availability.api';
import { formatTime, todayName } from './time';
import './Availability.css';

const IconChevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconBan = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path d="M5.5 5.5l13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconCalendarDot = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="2" />
    <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

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
      <div className="wh-header">
        <div>
          <h1 className="pa-title">Availability</h1>
          <p className="bd-page-sub">Control when customers can find and book you</p>
        </div>
      </div>

      {error && <p className="pa-error" role="alert">{error}</p>}

      <section className={`pa-status-card ${data.isOnline ? 'pa-status-on' : ''}`}>
        <div className="pa-status-left">
          <span className="pa-status-dot" aria-hidden="true" />
          <div>
            <h2 className="pa-status">{data.isOnline ? 'Online' : 'Offline'}</h2>
            <p className="pa-muted">
              {data.isOnline ? 'You are visible to customers' : 'You are hidden from customers'}
            </p>
          </div>
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
        <span className="pa-label"><IconCalendarDot /> This week</span>
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

      <div className="pa-links">
        <Link className="pa-link-row" to="/partner/working-hours">
          <span className="pa-link-icon"><IconClock /></span>
          <span className="pa-link-text">
            <span className="pa-label">Working Hours (Today)</span>
            <span className="pa-value">
              {!today || today.off
                ? 'Off day'
                : `${formatTime(today.start)}  -  ${formatTime(today.end)}`}
            </span>
          </span>
          <IconChevron />
        </Link>

        <Link className="pa-link-row" to="/partner/blackout-dates">
          <span className="pa-link-icon pa-link-icon-orange"><IconBan /></span>
          <span className="pa-link-text">
            <span className="pa-label">Blackout Dates</span>
            <span className="pa-value">Manage days you're unavailable</span>
          </span>
          <IconChevron />
        </Link>

        <Link className="pa-link-row" to="/partner/schedule">
          <span className="pa-link-icon"><IconCalendarDot /></span>
          <span className="pa-link-text">
            <span className="pa-label">Schedule</span>
            <span className="pa-value">View your calendar and upcoming jobs</span>
          </span>
          <IconChevron />
        </Link>
      </div>
    </div>
  );
};

export default PartnerAvailabilityPage;