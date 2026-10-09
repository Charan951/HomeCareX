import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import JobStatusActions from './JobStatusActions';
import { fetchJob, getErrorMessage, getHttpStatus } from './jobDetails.api';
import type { JobDetails } from './jobDetails.types';
import { LIFECYCLE, STATUS_LABEL } from './jobStatus';
import './jobDetails.css';

type LoadState = 'loading' | 'ready' | 'error' | 'notfound';

/** Statuses where no further action is possible, so the "next step" band is hidden. */
const TERMINAL: string[] = [
  'completed',
  'rated',
  'cancelled_by_customer',
  'cancelled_by_partner',
  'cancelled_by_admin',
  'no_show',
  'disputed',
];

const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' });
}

function useOnline(): boolean {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => {
      window.removeEventListener('online', up);
      window.removeEventListener('offline', down);
    };
  }, []);
  return online;
}

export default function JobDetailsPage() {
  const { id = '' } = useParams<{ id: string }>();
  const online = useOnline();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      setJob(await fetchJob(id));
      setState('ready');
    } catch (err) {
      const code = getHttpStatus(err);
      if (code === 404 || code === 403) {
        setState('notfound'); // own jobs only: another partner's id looks the same as a missing one
      } else {
        setMessage(getErrorMessage(err, 'Could not load this job.'));
        setState('error');
      }
    }
  }, [id]);

  /** Reloads without the skeleton, so an inline message on the page is not wiped. */
  const refreshQuietly = useCallback(async () => {
    try {
      setJob(await fetchJob(id));
    } catch {
      /* keep what is on screen; the user can reload */
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state === 'loading') {
    return (
      <div className="jd-page" aria-busy="true">
        <div className="jd-skel jd-skel-tall" />
        <div className="jd-skel" />
        <div className="jd-skel" />
      </div>
    );
  }

  if (state === 'notfound') {
    return (
      <div className="jd-page">
        <div className="jd-emptycard">
          <p className="jd-empty-title">Job not found</p>
          <p className="jd-empty">This job was not found, or it is not assigned to you.</p>
        </div>
      </div>
    );
  }

  if (state === 'error' || !job) {
    return (
      <div className="jd-page">
        <div className="jd-emptycard">
          <p className="jd-error" role="alert">
            {message || 'Could not load this job.'}
          </p>
          <button type="button" className="jd-btn" onClick={() => void load()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const currentStep = LIFECYCLE.indexOf(job.status);
  const lastStep = LIFECYCLE.length - 1;
  const time = formatTime(job.schedule.scheduledAt);
  const fullAddress = [job.location.address, job.location.city, job.location.pincode].filter(Boolean).join(', ');
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
  const doneCount = job.checklist.filter((c) => c.done).length;
  const payStatus = String(job.payment.status);
  const showActions = !TERMINAL.includes(job.status);

  return (
    <div className="jd-page">
      {!online && (
        <p className="jd-offline" role="status">
          You are offline. Status changes will not work until you reconnect.
        </p>
      )}

      {/* 1. Title, status, progress, next step */}
      <header className="jd-header">
        <div className="jd-header-text">
          <h2 className="jd-title">{job.service.name}</h2>
          <p className="jd-sub">Booking {job.bookingCode}</p>
        </div>
        <span className={`jd-badge jd-badge-${job.status}`}>{STATUS_LABEL[job.status]}</span>
      </header>

      {currentStep >= 0 && (
        <section className="jd-progress" aria-label="Job progress">
          <ol className="jd-steps">
            {LIFECYCLE.map((step, i) => {
              const stepState =
                i < currentStep || (i === currentStep && currentStep === lastStep)
                  ? 'done'
                  : i === currentStep
                    ? 'current'
                    : 'todo';
              return (
                <li
                  key={step}
                  className={`jd-step jd-step-${stepState}`}
                  aria-current={i === currentStep ? 'step' : undefined}
                >
                  {STATUS_LABEL[step]}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {showActions && (
        <div className="jd-actionwrap">
          <JobStatusActions job={job} onChanged={setJob} onStale={() => void refreshQuietly()} />
        </div>
      )}

      {/* 2. Summary strip: four short blocks of equal height */}
      <div className="jd-strip">
        <section className="jd-block jd-earn">
          <p className="jd-k-label">Your earning</p>
          <p className="jd-earn-amount">{money.format(job.price.partnerEarning)}</p>
          <p className="jd-earn-meta">From a job total of {money.format(job.price.total)}</p>
        </section>

        {fullAddress && (
          <section className="jd-block jd-loc-tile">
            <p className="jd-k-label">Location</p>
            <p className="jd-text">{fullAddress}</p>
            <a className="jd-btn jd-btn-link jd-inline-btn" href={mapsHref} target="_blank" rel="noreferrer">
              Get directions
            </a>
          </section>
        )}

        <section className="jd-block">
          <p className="jd-k-label">Customer</p>
          <div className="jd-person">
            <span className="jd-avatar" aria-hidden="true">
              {job.customer.name.charAt(0).toUpperCase()}
            </span>
            <div className="jd-person-text">
              <p className="jd-k-value">{job.customer.name}</p>
              <p className="jd-muted">{job.customer.phoneMasked}</p>
            </div>
          </div>
        </section>

        <section className="jd-block">
          <p className="jd-k-label">Schedule</p>
          <p className="jd-k-value">{formatDate(job.schedule.scheduledAt)}</p>
          <p className="jd-muted">{job.schedule.slot ?? (time || '—')}</p>
        </section>

        <section className="jd-block">
          <p className="jd-k-label">Payment</p>
          <p className="jd-k-value">{money.format(job.payment.amount)}</p>
          <p>
            <span className={`jd-chip jd-chip-${payStatus.toLowerCase()}`}>{payStatus}</span>
          </p>
        </section>
      </div>

      {/* 3. Body: work details on the left, money and history on the right */}
      <div className="jd-body">
        <div className="jd-body-main">
          <section className="jd-block jd-loc-block">
            <h3 className="jd-h2">Location</h3>
            <p className="jd-text">{fullAddress}</p>
            {fullAddress && (
              <a className="jd-btn jd-btn-link jd-inline-btn" href={mapsHref} target="_blank" rel="noreferrer">
                Get directions
              </a>
            )}
          </section>

          <section className="jd-block">
            <h3 className="jd-h2">Instructions</h3>
            <p className="jd-text">{job.instructions ?? 'No special instructions.'}</p>
          </section>

          <section className="jd-block">
            <div className="jd-h2-row">
              <h3 className="jd-h2">Checklist</h3>
              {job.checklist.length > 0 && (
                <span className="jd-muted">
                  {doneCount} of {job.checklist.length} done
                </span>
              )}
            </div>
            {job.checklist.length === 0 ? (
              <p className="jd-text">No checklist for this job.</p>
            ) : (
              <ul className="jd-checklist">
                {job.checklist.map((item) => (
                  <li key={item.id} className={item.done ? 'jd-check jd-check-done' : 'jd-check'}>
                    <span className="jd-tick" aria-hidden="true">
                      {item.done ? '✓' : ''}
                    </span>
                    {item.label}
                    <span className="jd-sr">{item.done ? ' (done)' : ' (not done)'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="jd-body-side">
          <section className="jd-block jd-price-block">
            <h3 className="jd-h2">Price</h3>
            <dl className="jd-list">
              {job.addOns.map((a) => (
                <div className="jd-row" key={a.id}>
                  <dt>
                    {a.name} × {a.quantity}
                  </dt>
                  <dd>{money.format(a.amount)}</dd>
                </div>
              ))}
              <dt>Job total</dt>
              <dd>{money.format(job.price.total)}</dd>
              <dt className="jd-total">Your earning</dt>
              <dd className="jd-total">{money.format(job.price.partnerEarning)}</dd>
            </dl>
          </section>

          <section className="jd-block jd-history-block">
            <h3 className="jd-h2">Status history</h3>
            {job.history.length === 0 ? (
              <p className="jd-text">No status changes yet.</p>
            ) : (
              <ol className="jd-history">
                {job.history.map((h, i) => (
                  <li key={`${h.status}-${h.at}-${i}`}>
                    <p className="jd-strong">{STATUS_LABEL[h.status]}</p>
                    <p className="jd-muted">
                      by {h.actor}, {new Date(h.at).toLocaleString('en-IN')}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}