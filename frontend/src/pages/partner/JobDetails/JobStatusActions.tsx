import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage, getHttpStatus, updateBookingStatus } from './jobDetails.api';
import type { JobDetails } from './jobDetails.types';
import { isCancelled, isFinished } from './jobStatus';

interface Props {
  job: Pick<JobDetails, 'id' | 'status' | 'actions' | 'otpRequired'>;
  onChanged: (job: JobDetails) => void;
  /** Called when the server says our view is out of date (422), so the page can reload quietly. */
  onStale: () => void;
}

export default function JobStatusActions({ job, onChanged, onStale }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (next: (typeof job.actions)[number]['status']) => {
    if (pending) return; // blocks duplicate taps
    if (!navigator.onLine) {
      setError('You are offline. Reconnect and try again.');
      return;
    }
    setPending(true);
    setError(null);
    try {
      onChanged(await updateBookingStatus(job.id, next));
    } catch (err) {
      if (getHttpStatus(err) === 422) {
        setError('This job was already updated. Showing the latest status.');
        onStale();
      } else {
        setError(getErrorMessage(err, 'Could not update the status. Try again.'));
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="jd-actions">
      {job.actions.map((action) => (
        <button
          key={action.status}
          type="button"
          className="jd-btn"
          onClick={() => void handleClick(action.status)}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Updating…' : action.label}
        </button>
      ))}

      {(job.otpRequired || job.status === 'in_progress') && (
        <Link className="jd-btn jd-btn-link" to={`/partner/jobs/${job.id}/active`}>
          {job.otpRequired ? 'Enter OTP to start' : 'Open active job'}
        </Link>
      )}

      {isFinished(job.status) && <p className="jd-hint">This job is completed.</p>}
      {isCancelled(job.status) && <p className="jd-hint">This job was cancelled.</p>}

      {error && (
        <p className="jd-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}