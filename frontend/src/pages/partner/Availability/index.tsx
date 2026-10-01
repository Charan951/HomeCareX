import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, CalendarClock, CalendarDays, ChevronRight, Clock } from 'lucide-react';
import { Availability, getAvailability, setOnline } from './availability.api';
import { getSchedule, Schedule as ScheduleData } from '../Schedule/schedule.api';
import { formatTime, todayName } from './time';
import { usePartnerStatus } from '@/layouts/PartnerLayout';
import './Availability.css';
import './AvailabilityPage.css';

const HORIZON = 30; // days shown in the "next 30 days" summary
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const pad = (n: number) => String(n).padStart(2, '0');
const todayStr = () => {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
};
const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const dayNameOf = (s: string) => DAY_NAMES[new Date(`${s}T00:00:00Z`).getUTCDay()];
const shortDate = (s: string) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const delay = (ms: number) => ({ '--d': `${ms}ms` } as React.CSSProperties);

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

const Stat: React.FC<{ label: string; value: number | null; tone: 'working' | 'off' | 'blackout' }> = ({ label, value, tone }) => {
  const n = useCountUp(value ?? 0);
  return (
    <div className={`av-stat av-stat-${tone}`}>
      <span className="av-stat-num">{value === null ? '-' : n}</span>
      <span className="av-stat-label">{label}</span>
    </div>
  );
};

const LinkCard: React.FC<{
  to: string; icon: React.ReactNode; orange?: boolean; label: string; value: string; sub: string; ms: number;
}> = ({ to, icon, orange, label, value, sub, ms }) => (
  <Link className="av-link av-rise" style={delay(ms)} to={to}>
    <span className={`av-link-icon ${orange ? 'av-link-icon-orange' : ''}`}>{icon}</span>
    <span className="av-link-text">
      <span className="av-link-label">{label}</span>
      <span className="av-link-value">{value}</span>
      <span className="av-link-sub">{sub}</span>
    </span>
    <ChevronRight className="av-link-arrow" size={20} aria-hidden="true" />
  </Link>
);

export const PartnerAvailabilityPage: React.FC = () => {
  const { setOnline: setHeaderOnline } = usePartnerStatus();
  const [data, setData] = useState<Availability | null>(null);
  const [sched, setSched] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = todayStr();
      const [avail, schedule] = await Promise.all([
        getAvailability(),
        getSchedule(from, addDays(from, HORIZON - 1)).catch(() => null), // summary is optional
      ]);
      setData(avail);
      setSched(schedule);
      setHeaderOnline(avail.isOnline); // keep the header pill in sync
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [setHeaderOnline]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = async () => {
    if (!data || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await setOnline(!data.isOnline);
      setData(updated);
      setHeaderOnline(updated.isOnline);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update status');
    } finally {
      setSaving(false);
    }
  };

  const stats = useMemo(() => {
    if (!data) return null;
    const blackouts = new Set((sched?.blackoutDates ?? []).map((b) => b.date));
    const from = todayStr();
    let working = 0;
    let off = 0;
    let blackout = 0;
    for (let i = 0; i < HORIZON; i++) {
      const date = addDays(from, i);
      if (blackouts.has(date)) {
        blackout++;
        continue;
      }
      const wd = data.workingHours.find((w) => w.day === dayNameOf(date));
      if (!wd || wd.off) off++;
      else working++;
    }
    return { working, off, blackout: sched ? blackout : null };
  }, [data, sched]);

  if (loading && !data) {
    return (
      <div className="av-page" aria-busy="true">
        <div className="av-skel av-skel-hero" />
        <div className="av-grid">
          <div className="av-skel" />
          <div className="av-skel" />
        </div>
        <div className="av-links">
          <div className="av-skel" />
          <div className="av-skel" />
          <div className="av-skel" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="av-page">
        <p className="pa-error" role="alert">{error ?? 'No availability found.'}</p>
        <button className="pa-btn" onClick={load}>Try again</button>
      </div>
    );
  }

  const today = todayStr();
  const todayHours = data.workingHours.find((d) => d.day === todayName());
  const todayBlackout = (sched?.blackoutDates ?? []).find((b) => b.date === today);
  const nextBlackout = (sched?.blackoutDates ?? []).find((b) => b.date >= today);
  const workingToday = !!todayHours && !todayHours.off && !todayBlackout;
  const todayLabel = todayBlackout
    ? `Blackout today · ${todayBlackout.reason}`
    : workingToday && todayHours
      ? `Today · ${formatTime(todayHours.start)} - ${formatTime(todayHours.end)}`
      : 'Day off today';

  return (
    <div className="av-page">
      <p className="av-lead av-rise" style={delay(0)}>Control when customers can find and book you</p>

      {error && <p className="pa-error" role="alert">{error}</p>}

      <section className={`av-hero av-rise ${data.isOnline ? 'av-hero-on' : ''}`} style={delay(60)}>
        <div className="av-hero-main">
          <span className="av-dot" aria-hidden="true" />
          <div>
            <h2 className="av-hero-title">{data.isOnline ? 'Online' : 'Offline'}</h2>
            <p className="av-hero-sub">
              {data.isOnline ? 'You are visible to customers and can receive new jobs' : 'You are hidden from customers'}
            </p>
            <p className={`av-hero-today ${todayBlackout ? 'av-hero-today-blackout' : ''}`}>
              <Clock size={14} aria-hidden="true" /> {todayLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={data.isOnline}
          aria-label="Available for jobs"
          className={`av-switch ${data.isOnline ? 'av-switch-on' : ''}`}
          onClick={toggle}
          disabled={saving}
        >
          <span className="av-knob" />
        </button>
      </section>

      <div className="av-grid">
        <section className="av-card av-rise" style={delay(140)}>
          <h3 className="av-card-title"><CalendarDays size={16} aria-hidden="true" /> This week</h3>
          <div className="av-chips">
            {data.workingHours.map((d) => (
              <span
                key={d.day}
                className={`av-chip ${d.off ? 'av-chip-off' : ''} ${d.day === todayName() ? 'av-chip-today' : ''}`}
                title={d.off ? `${d.day}: off` : `${d.day}: working`}
              >
                {d.day.slice(0, 3)}
              </span>
            ))}
          </div>
        </section>

        <section className="av-card av-rise" style={delay(200)}>
          <h3 className="av-card-title"><CalendarClock size={16} aria-hidden="true" /> Next {HORIZON} days</h3>
          {stats && (
            <div className="av-stats">
              <Stat label="Working days" value={stats.working} tone="working" />
              <Stat label="Days off" value={stats.off} tone="off" />
              <Stat label="Blackouts" value={stats.blackout} tone="blackout" />
            </div>
          )}
          {!sched && <p className="av-card-foot">Blackout summary could not be loaded.</p>}
        </section>
      </div>

      <div className="av-links">
        <LinkCard
          to="/partner/working-hours"
          icon={<Clock size={20} aria-hidden="true" />}
          label="Working hours"
          value={workingToday && todayHours ? `${formatTime(todayHours.start)} - ${formatTime(todayHours.end)}` : 'Off day'}
          sub="Edit your weekly hours"
          ms={260}
        />
        <LinkCard
          to="/partner/blackout-dates"
          icon={<Ban size={20} aria-hidden="true" />}
          orange
          label="Blackout dates"
          value={nextBlackout ? shortDate(nextBlackout.date) : 'None upcoming'}
          sub={nextBlackout ? nextBlackout.reason : "Manage days you're unavailable"}
          ms={320}
        />
        <LinkCard
          to="/partner/schedule"
          icon={<CalendarDays size={20} aria-hidden="true" />}
          label="Schedule"
          value="View calendar"
          sub="Month view with jobs and blackouts"
          ms={380}
        />
      </div>
    </div>
  );
};

export default PartnerAvailabilityPage;