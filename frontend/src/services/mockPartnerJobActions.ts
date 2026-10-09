import type { JobRequest } from "@/types/partner";

import { emitPartnerJobExpired } from "./mockPartnerEvents";

/* =========================================================
   MOCK RESPONSE TYPES
========================================================= */

export interface MockJobActionResult {
  success: boolean;
  status: number;
  message: string;
  job?: JobRequest;
}

/* =========================================================
   INTERNAL JOB STATE
========================================================= */

type JobState = "OFFERED" | "ACCEPTED" | "REJECTED" | "EXPIRED";

interface StoredJob {
  job: JobRequest;

  state: JobState;

  /** The partner this 60-second offer was sent to */
  offeredTo?: string;

  acceptedBy?: string;

  rejectedBy: Set<string>;
}

/* jobId → job state (a small mock database) */
const jobs = new Map<string, StoredJob>();

/* =========================================================
   DECISION EVENTS

   Fired when an offer is ACCEPTED, REJECTED or EXPIRED.
   mockJobReoffer.ts listens to these to decide what
   happens next (stop, or offer to the next partner).
========================================================= */

export type JobDecision = "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface JobDecisionEvent {
  jobId: string;
  partnerId: string;
  decision: JobDecision;
}

type DecisionListener = (event: JobDecisionEvent) => void;

const decisionListeners = new Set<DecisionListener>();

export const subscribeToJobDecisions = (listener: DecisionListener) => {
  decisionListeners.add(listener);

  return () => {
    decisionListeners.delete(listener);
  };
};

const notifyDecision = (event: JobDecisionEvent) => {
  [...decisionListeners].forEach((listener) => listener(event));
};

/* =========================================================
   ACCEPT GUARD

   Lets the re-offer logic check, at the moment of accepting,
   that the partner is still eligible. Returns a message if
   the accept must be refused, or null if it is fine.
========================================================= */

type AcceptGuard = (job: JobRequest, partnerId: string) => string | null;

let acceptGuard: AcceptGuard | null = null;

export const setAcceptGuard = (guard: AcceptGuard) => {
  acceptGuard = guard;
};

/* =========================================================
   REGISTER JOB

   Call this before emitting partner:new_job.
   partnerId is the partner the offer is sent to.
========================================================= */

export const registerMockJob = (job: JobRequest, partnerId?: string) => {
  jobs.set(job.id, {
    job,
    state: "OFFERED",
    offeredTo: partnerId,
    rejectedBy: new Set<string>(),
  });

  console.log("[Mock Jobs] Job registered:", job.id, "for", partnerId ?? "-");
};

/* =========================================================
   GET JOB
========================================================= */

export const getMockJob = (jobId: string): StoredJob | undefined => {
  return jobs.get(jobId);
};

/* =========================================================
   CHECK EXPIRY
========================================================= */

const isExpired = (job: JobRequest) => {
  const expiresAt = new Date(job.expiresAt).getTime();

  return expiresAt <= Date.now();
};

/* =========================================================
   MARK EXPIRED (only once)

   Tells the partner's page to remove the card and tells the
   re-offer logic to move to the next partner.
========================================================= */

const markExpired = (stored: StoredJob) => {
  if (stored.state !== "OFFERED") {
    return;
  }

  stored.state = "EXPIRED";

  console.log("[Mock Jobs] Job expired:", stored.job.id);

  if (stored.offeredTo) {
    emitPartnerJobExpired(stored.job.id, stored.offeredTo);
  }

  notifyDecision({
    jobId: stored.job.id,
    partnerId: stored.offeredTo ?? "",
    decision: "EXPIRED",
  });
};

/* =========================================================
   EXPIRE JOB
========================================================= */

export const expireMockJob = (jobId: string): MockJobActionResult => {
  const storedJob = jobs.get(jobId);

  if (!storedJob) {
    return {
      success: false,
      status: 404,
      message: "Job not found.",
    };
  }

  if (storedJob.state === "ACCEPTED") {
    return {
      success: false,
      status: 409,
      message: "Job has already been accepted.",
      job: storedJob.job,
    };
  }

  if (storedJob.state === "REJECTED") {
    return {
      success: false,
      status: 409,
      message: "Job has already been rejected.",
      job: storedJob.job,
    };
  }

  if (storedJob.state === "EXPIRED") {
    return {
      success: false,
      status: 409,
      message: "Job offer has already expired.",
      job: storedJob.job,
    };
  }

  markExpired(storedJob);

  return {
    success: true,
    status: 200,
    message: "Job offer expired.",
    job: storedJob.job,
  };
};

/* =========================================================
   POST /partner/jobs/:id/accept

   200 = you got the job
   404 = no such job for you
   409 = expired, rejected, already accepted, or you are
         no longer eligible

   Atomic: the state check and the change to ACCEPTED happen
   in one synchronous step, so the first caller wins.
========================================================= */

export const acceptMockJob = (
  jobId: string,
  partnerId: string,
): MockJobActionResult => {
  const storedJob = jobs.get(jobId);

  /* JOB NOT FOUND, OR OFFERED TO SOMEONE ELSE */

  if (!storedJob) {
    return {
      success: false,
      status: 404,
      message: "Job not found.",
    };
  }

  if (storedJob.offeredTo && storedJob.offeredTo !== partnerId) {
    return {
      success: false,
      status: 404,
      message: "Job not found.",
    };
  }

  /* 60 SECONDS PASSED */

  if (storedJob.state === "OFFERED" && isExpired(storedJob.job)) {
    markExpired(storedJob);
  }

  /* ALREADY DECIDED */

  if (storedJob.state === "ACCEPTED") {
    return {
      success: false,
      status: 409,
      message:
        storedJob.acceptedBy === partnerId
          ? "You have already accepted this job."
          : "Job was already accepted by another partner.",
      job: storedJob.job,
    };
  }

  if (storedJob.state === "REJECTED") {
    return {
      success: false,
      status: 409,
      message: "Job offer was rejected.",
      job: storedJob.job,
    };
  }

  if (storedJob.state === "EXPIRED") {
    return {
      success: false,
      status: 409,
      message: "Job offer has expired.",
      job: storedJob.job,
    };
  }

  /* STILL ELIGIBLE?  (online, approved, no schedule conflict) */

  const problem = acceptGuard?.(storedJob.job, partnerId);

  if (problem) {
    /* Pass the offer on straight away */
    markExpired(storedJob);

    return {
      success: false,
      status: 409,
      message: problem,
      job: storedJob.job,
    };
  }

  /* WINNER */

  storedJob.state = "ACCEPTED";

  storedJob.acceptedBy = partnerId;

  console.log("[Mock Jobs] ACCEPTED:", partnerId, "accepted", jobId);

  notifyDecision({
    jobId,
    partnerId,
    decision: "ACCEPTED",
  });

  return {
    success: true,
    status: 200,
    message: "Job accepted successfully.",
    job: storedJob.job,
  };
};

/* =========================================================
   POST /partner/jobs/:id/reject
========================================================= */

export const rejectMockJob = (
  jobId: string,
  partnerId: string,
): MockJobActionResult => {
  const storedJob = jobs.get(jobId);

  if (!storedJob) {
    return {
      success: false,
      status: 404,
      message: "Job not found.",
    };
  }

  if (storedJob.offeredTo && storedJob.offeredTo !== partnerId) {
    return {
      success: false,
      status: 404,
      message: "Job not found.",
    };
  }

  if (storedJob.state === "OFFERED" && isExpired(storedJob.job)) {
    markExpired(storedJob);
  }

  if (storedJob.state === "ACCEPTED") {
    return {
      success: false,
      status: 409,
      message: "Job has already been accepted.",
      job: storedJob.job,
    };
  }

  if (storedJob.state === "EXPIRED") {
    return {
      success: false,
      status: 409,
      message: "Job offer has expired.",
      job: storedJob.job,
    };
  }

  if (storedJob.state === "REJECTED") {
    return {
      success: false,
      status: 409,
      message: "You have already rejected this job.",
      job: storedJob.job,
    };
  }

  /* The state becomes REJECTED so the re-offer logic moves to
     the next partner immediately. */

  storedJob.state = "REJECTED";

  storedJob.rejectedBy.add(partnerId);

  console.log("[Mock Jobs] REJECTED:", partnerId, "rejected", jobId);

  notifyDecision({
    jobId,
    partnerId,
    decision: "REJECTED",
  });

  return {
    success: true,
    status: 200,
    message: "Job rejected successfully.",
    job: storedJob.job,
  };
};

/* =========================================================
   OPEN JOBS FOR A PARTNER
========================================================= */

export const getOpenJobsForPartner = (partnerId: string): JobRequest[] => {
  return Array.from(jobs.values())
    .filter(
      (storedJob) =>
        storedJob.state === "OFFERED" &&
        storedJob.offeredTo === partnerId &&
        !isExpired(storedJob.job),
    )
    .map((storedJob) => storedJob.job);
};

/* =========================================================
   GET JOB STATE
========================================================= */

export const getMockJobState = (jobId: string) => {
  const storedJob = jobs.get(jobId);

  if (!storedJob) {
    return undefined;
  }

  if (storedJob.state === "OFFERED" && isExpired(storedJob.job)) {
    markExpired(storedJob);
  }

  return {
    job: storedJob.job,
    state: storedJob.state,
    offeredTo: storedJob.offeredTo,
    acceptedBy: storedJob.acceptedBy,
    rejectedBy: Array.from(storedJob.rejectedBy),
  };
};

/* =========================================================
   GET ALL MOCK JOBS
========================================================= */

export const getAllMockJobs = () => {
  return Array.from(jobs.values()).map((storedJob) => ({
    job: storedJob.job,
    state: storedJob.state,
    offeredTo: storedJob.offeredTo,
    acceptedBy: storedJob.acceptedBy,
    rejectedBy: Array.from(storedJob.rejectedBy),
  }));
};

/* =========================================================
   CLEAR MOCK JOBS
========================================================= */

export const clearMockJobs = () => {
  jobs.clear();

  console.log("[Mock Jobs] All mock jobs cleared.");
};