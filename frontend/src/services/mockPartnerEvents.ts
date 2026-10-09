import type { JobRequest } from "@/types/partner";

/* =========================================================
   PARTNER JOB EVENT   (partner:new_job)
========================================================= */

export interface MockPartnerJobEvent {
  job: JobRequest;
  partnerId: string;
}

/* =========================================================
   PARTNER JOB EXPIRED EVENT   (partner:job_expired)

   Sent to the partner whose 60-second offer ended, so the
   card disappears at the same moment the job moves on to
   the next partner.
========================================================= */

export interface MockPartnerJobExpiredEvent {
  jobId: string;
  partnerId: string;
}

/* =========================================================
   LISTENERS
========================================================= */

type JobListener = (event: MockPartnerJobEvent) => void;
type JobExpiredListener = (event: MockPartnerJobExpiredEvent) => void;

const listeners = new Set<JobListener>();
const expiredListeners = new Set<JobExpiredListener>();

/* =========================================================
   SUBSCRIBE TO partner:new_job
========================================================= */

export const subscribeToNewJobs = (listener: JobListener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/* =========================================================
   EMIT partner:new_job
========================================================= */

export const emitPartnerNewJob = (job: JobRequest, partnerId: string) => {
  const event: MockPartnerJobEvent = {
    job,
    partnerId,
  };

  console.log("[Mock Socket] partner:new_job", event);

  listeners.forEach((listener) => {
    listener(event);
  });
};

/* =========================================================
   SUBSCRIBE TO partner:job_expired
========================================================= */

export const subscribeToJobExpired = (listener: JobExpiredListener) => {
  expiredListeners.add(listener);

  return () => {
    expiredListeners.delete(listener);
  };
};

/* =========================================================
   EMIT partner:job_expired
========================================================= */

export const emitPartnerJobExpired = (jobId: string, partnerId: string) => {
  const event: MockPartnerJobExpiredEvent = {
    jobId,
    partnerId,
  };

  console.log("[Mock Socket] partner:job_expired", event);

  expiredListeners.forEach((listener) => {
    listener(event);
  });
};