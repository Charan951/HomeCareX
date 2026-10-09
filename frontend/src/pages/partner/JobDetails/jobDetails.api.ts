import api from '@/lib/api';
import { mapJob } from './jobDetails.mapper';
import type { ApiJob, JobDetails } from './jobDetails.types';
import type { JobAction } from './jobStatus';

export async function fetchJob(id: string): Promise<JobDetails> {
  const res = await api.get<{ data: ApiJob }>(`/partner/jobs/${id}`);
  return mapJob(res.data.data);
}

/** Returns the updated job, so the page never has to guess what changed. */
export async function updateBookingStatus(
  bookingId: string,
  status: JobAction['status'],
): Promise<JobDetails> {
  const res = await api.patch<{ data: ApiJob }>(`/bookings/${bookingId}/status`, { status });
  return mapJob(res.data.data);
}

export function getHttpStatus(err: unknown): number | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { status?: unknown } }).response;
    if (typeof response?.status === 'number') return response.status;
  }
  return null;
}

export function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  return fallback;
}