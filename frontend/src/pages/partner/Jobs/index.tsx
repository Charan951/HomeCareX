import { useCallback, useEffect, useRef, useState } from "react";
 
import JobOutcomeCard from "@/components/partner/JobOutcomeCard";
 
import JobRequestCard from "@/components/partner/JobRequestCard";
 
import MockConfirmedBookingButton from "@/components/partner/MockConfirmedBookingButton";
 
import { partnerApi } from "@/services/partnerApi";
 
import {
  subscribeToJobExpired,
  subscribeToNewJobs,
} from "@/services/mockPartnerEvents";
 
import { setMockPartnerOnline } from "@/services/mockPartnerJobs";
 
import { usePartnerStatus } from "@/layouts/PartnerLayout";
 
import type { JobRequest } from "@/types/partner";
 
/* Later this will come from the authenticated partner. */
const PARTNER_ID = "partner-1";
 
/* ---------- helpers ---------- */
 
const expiryTime = (job: JobRequest) => new Date(job.expiresAt).getTime();
 
const isLive = (job: JobRequest) => expiryTime(job) > Date.now();
 
const mergeJobs = (
  current: JobRequest[],
  incoming: JobRequest[],
  handled: Set<string>,
): JobRequest[] => {
  const byId = new Map<string, JobRequest>();
 
  [...current, ...incoming].forEach((job) => {
    if (!handled.has(job.id) && isLive(job)) {
      byId.set(job.id, job);
    }
  });
 
  return [...byId.values()].sort((a, b) => expiryTime(a) - expiryTime(b));
};
 
const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;
 
/* ---------- toasts ---------- */
 
type ToastKind = "success" | "info" | "error";
 
interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}
 
const TOAST_MS = 5000;
 
const MAX_TOASTS = 3;
 
const toastStyles: Record<ToastKind, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  info: "border-line bg-panel text-ink",
  error: "border-red-200 bg-red-50 text-red-700",
};
 
/* ---------- accepted / rejected result cards ---------- */
 
interface Outcome {
  id: string;
  status: "accepted" | "rejected";
  request: JobRequest;
}
 
/* ---------- page ---------- */
 
export default function PartnerJobRequestsPage() {
  const { online } = usePartnerStatus();
 
  const [requests, setRequests] = useState<JobRequest[]>([]);
 
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
 
  const [loading, setLoading] = useState(true);
 
  const [error, setError] = useState("");
 
  const [toasts, setToasts] = useState<Toast[]>([]);
 
  const mountedRef = useRef(true);
 
  const onlineRef = useRef(online);
 
  const requestsRef = useRef<JobRequest[]>([]);
 
  /* Jobs this partner has accepted, rejected or lost */
  const handledRef = useRef<Set<string>>(new Set());
 
  /* Jobs with a request in flight (blocks double clicks) */
  const pendingRef = useRef<Set<string>>(new Set());
 
  /* Only the newest full load may change the loading state */
  const loadSeq = useRef(0);
 
  const toastId = useRef(0);
 
  const toastTimers = useRef<number[]>([]);
 
  useEffect(() => {
    mountedRef.current = true;
 
    const timers = toastTimers.current;
 
    return () => {
      mountedRef.current = false;
 
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);
 
  useEffect(() => {
    onlineRef.current = online;
  }, [online]);
 
  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);
 
  const removeRequest = useCallback((id: string) => {
    setRequests((current) => current.filter((item) => item.id !== id));
  }, []);
 
  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);
 
  const pushToast = useCallback(
    (kind: ToastKind, text: string) => {
      toastId.current += 1;
 
      const id = toastId.current;
 
      setToasts((current) => [
        ...current.slice(-(MAX_TOASTS - 1)),
        { id, kind, text },
      ]);
 
      toastTimers.current.push(
        window.setTimeout(() => dismissToast(id), TOAST_MS),
      );
    },
    [dismissToast],
  );
 
  const addOutcome = useCallback(
    (status: Outcome["status"], request: JobRequest) => {
      setOutcomes((current) => [
        { id: request.id, status, request },
        ...current.filter((item) => item.id !== request.id),
      ]);
    },
    [],
  );
 
  const dismissOutcome = useCallback((id: string) => {
    setOutcomes((current) => current.filter((item) => item.id !== id));
  }, []);
 
  /* 1. Tell the mock backend if this partner is online */
 
  useEffect(() => {
    setMockPartnerOnline(PARTNER_ID, online);
  }, [online]);
 
  /* 2. Load offers that are already open */
 
  const loadJobs = useCallback(
    async (silent = false) => {
      const seq = silent ? loadSeq.current : ++loadSeq.current;
 
      if (!online) {
        setRequests([]);
        setLoading(false);
        setError("");
 
        return;
      }
 
      try {
        if (!silent) {
          setLoading(true);
          setError("");
        }
 
        const data = await partnerApi.getJobOffers(PARTNER_ID);
 
        if (!mountedRef.current || !onlineRef.current) {
          return;
        }
 
        setRequests((current) => mergeJobs(current, data, handledRef.current));
      } catch (err) {
        console.error("[Partner Jobs] Failed to load jobs:", err);
 
        if (!silent && mountedRef.current && seq === loadSeq.current) {
          setError("Could not load job requests.");
        }
      } finally {
        if (!silent && mountedRef.current && seq === loadSeq.current) {
          setLoading(false);
        }
      }
    },
    [online],
  );
 
  useEffect(() => {
    loadJobs(false);
  }, [loadJobs]);
 
  /* 3. Refresh when the tab comes back */
 
  useEffect(() => {
    if (!online) {
      return;
    }
 
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setRequests((current) => mergeJobs(current, [], handledRef.current));
 
        loadJobs(true);
      }
    };
 
    document.addEventListener("visibilitychange", onVisible);
 
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [online, loadJobs]);
 
  /* 4. partner:new_job */
 
  useEffect(() => {
    if (!online) {
      return;
    }
 
    const unsubscribe = subscribeToNewJobs((event) => {
      if (event.partnerId !== PARTNER_ID) {
        return;
      }
 
      const job = event.job;
 
      if (!isLive(job) || handledRef.current.has(job.id)) {
        return;
      }
 
      const isNew = !requestsRef.current.some((item) => item.id === job.id);
 
      setRequests((current) => mergeJobs(current, [job], handledRef.current));
 
      if (isNew) {
        pushToast(
          "info",
          `New job: ${job.service} in ${job.area} · ${money(job.price)}`,
        );
      }
    });
 
    return unsubscribe;
  }, [online, pushToast]);
 
  /* 5. partner:job_expired */
 
  useEffect(() => {
    if (!online) {
      return;
    }
 
    const unsubscribe = subscribeToJobExpired((event) => {
      if (event.partnerId !== PARTNER_ID) {
        return;
      }
 
      handledRef.current.add(event.jobId);
 
      const wasShown = requestsRef.current.some(
        (item) => item.id === event.jobId,
      );
 
      removeRequest(event.jobId);
 
      if (wasShown) {
        pushToast("info", "An offer expired and was sent to the next partner.");
      }
    });
 
    return unsubscribe;
  }, [online, removeRequest, pushToast]);
 
  /* 6. Safety net: drop any card past its 60 seconds */
 
  useEffect(() => {
    if (!online) {
      return;
    }
 
    const timer = window.setInterval(() => {
      setRequests((current) => {
        const live = current.filter(isLive);
 
        return live.length === current.length ? current : live;
      });
    }, 1000);
 
    return () => window.clearInterval(timer);
  }, [online]);
 
  /* 7. Browser tab title */
 
  useEffect(() => {
    const previousTitle = document.title;
 
    document.title =
      requests.length > 0
        ? `(${requests.length}) Job Requests | HomeCareX`
        : "Job Requests | HomeCareX";
 
    return () => {
      document.title = previousTitle;
    };
  }, [requests.length]);
 
  /* Accept: POST /partner/jobs/:id/accept  →  200 | 404 | 409 */
 
  const handleAccept = async (id: string) => {
    const request = requestsRef.current.find((item) => item.id === id);
 
    if (!request || pendingRef.current.has(id)) {
      return;
    }
 
    pendingRef.current.add(id);
 
    try {
      const result = await partnerApi.acceptJobOffer(id, PARTNER_ID);
 
      if (!mountedRef.current) {
        return;
      }
 
      if ([200, 404, 409].includes(result.status)) {
        handledRef.current.add(id);
 
        removeRequest(id);
      }
 
      if (result.status === 200) {
        addOutcome("accepted", request);
 
        pushToast(
          "success",
          `Job accepted: ${request.service} in ${request.area} · ${money(request.price)}`,
        );
      } else if (result.status === 409) {
        pushToast("error", `Job is no longer available. ${result.message}`);
      } else if (result.status === 404) {
        pushToast("error", "This job could not be found.");
      } else {
        pushToast("error", result.message || "Could not accept the job.");
      }
    } catch (err) {
      console.error("[Partner Jobs] Accept request failed:", err);
 
      pushToast("error", "Could not accept the job. Please try again.");
    } finally {
      pendingRef.current.delete(id);
    }
  };
 
  /* Reject: POST /partner/jobs/:id/reject  →  200 | 404 | 409 */
 
  const handleReject = async (id: string) => {
    const request = requestsRef.current.find((item) => item.id === id);
 
    if (!request || pendingRef.current.has(id)) {
      return;
    }
 
    pendingRef.current.add(id);
 
    try {
      const result = await partnerApi.rejectJobOffer(id, PARTNER_ID);
 
      if (!mountedRef.current) {
        return;
      }
 
      if ([200, 404, 409].includes(result.status)) {
        handledRef.current.add(id);
 
        removeRequest(id);
      }
 
      if (result.status === 200) {
        addOutcome("rejected", request);
 
        pushToast("info", "Job declined. It goes to the next partner.");
      } else if (result.status === 409) {
        pushToast("error", `Job is no longer available. ${result.message}`);
      } else if (result.status === 404) {
        pushToast("error", "This job could not be found.");
      } else {
        pushToast("error", result.message || "Could not reject the job.");
      }
    } catch (err) {
      console.error("[Partner Jobs] Reject request failed:", err);
 
      pushToast("error", "Could not reject the job. Please try again.");
    } finally {
      pendingRef.current.delete(id);
    }
  };
 
  const toastList = (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${toastStyles[toast.kind]}`}
        >
          <p className="min-w-0 flex-1">{toast.text}</p>
 
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss message"
            className="shrink-0 rounded px-1 text-base leading-none opacity-60 hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
 
  if (!online) {
    return (
      <section className="w-full">
        <div className="rounded-lg border border-line bg-panel p-6">
          <h1 className="text-xl font-semibold text-ink">Job Requests</h1>
 
          <p className="mt-2 text-sm text-muted">
            You are offline. Go online to receive new job requests.
          </p>
        </div>
 
        {toastList}
      </section>
    );
  }
 
  if (loading) {
    return (
      <section className="w-full" aria-busy="true">
        <div className="rounded-lg border border-line bg-panel p-6">
          <p className="text-sm text-muted">Loading job requests...</p>
        </div>
 
        {toastList}
      </section>
    );
  }
 
  if (error) {
    return (
      <section className="w-full">
        <div className="rounded-lg border border-line bg-panel p-6">
          <p className="text-sm text-red-600">{error}</p>
 
          <button
            type="button"
            onClick={() => loadJobs(false)}
            className="mt-4 rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-canvas focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
          >
            Try again
          </button>
        </div>
 
        {toastList}
      </section>
    );
  }
 
  return (
    <section className="w-full">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink">Job Requests</h1>
 
            <p className="mt-1 text-sm text-muted">
              {requests.length > 0
                ? `${requests.length} open ${
                    requests.length === 1 ? "request" : "requests"
                  }. Each offer lasts 60 seconds.`
                : "New jobs available for you. Each offer lasts 60 seconds."}
            </p>
          </div>
 
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
            <span
              className="h-2 w-2 rounded-full bg-green-500"
              aria-hidden="true"
            />
            Online
          </div>
        </div>
      </div>
 
      {/* Dev only: confirm a booking to test the whole flow */}
 
      {import.meta.env.DEV && <MockConfirmedBookingButton />}
 
      {requests.length === 0 && outcomes.length === 0 ? (
        <div className="rounded-lg border border-line bg-panel p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-canvas">
            <span className="text-xl" aria-hidden="true">
              ✓
            </span>
          </div>
 
          <h2 className="mt-4 text-base font-medium text-ink">
            No job requests
          </h2>
 
          <p className="mt-1 text-sm text-muted">
            New eligible job requests will appear here when they are
            available.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2" aria-label="Job requests">
          {outcomes.map((outcome) => (
            <JobOutcomeCard
              key={`outcome-${outcome.id}`}
              status={outcome.status}
              request={outcome.request}
              onDismiss={dismissOutcome}
            />
          ))}
 
          {requests.map((request) => (
            <JobRequestCard
              key={request.id}
              request={request}
              onAccept={handleAccept}
              onReject={handleReject}
            />
          ))}
        </ul>
      )}
 
      {toastList}
    </section>
  );
}
 