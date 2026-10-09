
const PARTNER_ID = "partner-1";

/* =========================================================
   HELPERS

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

/* =========================================================
   TOASTS

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

/* =========================================================
   OUTCOMES (accepted / rejected result cards)

interface Outcome {
  id: string;
  status: "accepted" | "rejected";
  request: JobRequest;
}

/* =========================================================
   PARTNER JOBS PAGE

export default function PartnerJobsPage() {
  const { online } = usePartnerStatus();

  const [requests, setRequests] = useState<JobRequest[]>([]);

  const [outcomes, setOutcomes] = useState<Outcome[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [toasts, setToasts] = useState<Toast[]>([]);

  /* REFS */

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

  /* SMALL STATE HELPERS */

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

  /* =======================================================
     1. TELL THE MOCK BACKEND IF THIS PARTNER IS ONLINE
  ======================================================= */

  useEffect(() => {
    setMockPartnerOnline(PARTNER_ID, online);
  }, [online]);

  /* =======================================================
     2. LOAD OFFERS THAT ARE ALREADY OPEN
  ======================================================= */

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

        const data = await partnerApi.getJobRequests(PARTNER_ID);

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

  /* =======================================================
     3. REFRESH WHEN THE TAB COMES BACK
  ======================================================= */

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

  /* =======================================================
     4. partner:new_job
  ======================================================= */

  useEffect(() => {
    if (!online) {
      return;
    }

    const unsubscribe = subscribeToNewJobs((event) => {
      console.log("[Mock Socket] partner:new_job received:", event);

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

  /* =======================================================
     5. partner:job_expired
  ======================================================= */

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

  /* =======================================================
     6. SAFETY NET
  ======================================================= */

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

  /* =======================================================
     7. BROWSER TAB TITLE
  ======================================================= */

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

  /* =======================================================
     ACCEPT JOB   POST /partner/jobs/:id/accept
  ======================================================= */

  const handleAccept = async (id: string) => {
    const request = requestsRef.current.find((item) => item.id === id);

    if (!request || pendingRef.current.has(id)) {
      return;
    }

    pendingRef.current.add(id);

    try {
      const result = await partnerApi.acceptJob(id, PARTNER_ID);

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
        console.error("[Partner Jobs] Accept failed:", result);

        pushToast("error", result.message || "Could not accept the job.");
      }
    } catch (err) {
      console.error("[Partner Jobs] Accept request failed:", err);

      pushToast("error", "Could not accept the job. Please try again.");
    } finally {
      pendingRef.current.delete(id);
    }
  };

  /* =======================================================
     REJECT JOB   POST /partner/jobs/:id/reject
  ======================================================= */

  const handleReject = async (id: string) => {
    const request = requestsRef.current.find((item) => item.id === id);

    if (!request || pendingRef.current.has(id)) {
      return;
    }

    pendingRef.current.add(id);

    try {
      const result = await partnerApi.rejectJob(id, PARTNER_ID);

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
        console.error("[Partner Jobs] Reject failed:", result);

        pushToast("error", result.message || "Could not reject the job.");
      }
    } catch (err) {
      console.error("[Partner Jobs] Reject request failed:", err);

      pushToast("error", "Could not reject the job. Please try again.");
    } finally {
      pendingRef.current.delete(id);
    }
  };

  /* =======================================================
     TOAST LIST
  ======================================================= */

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

  /* OFFLINE STATE */

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

  /* LOADING STATE */

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

  /* ERROR STATE */

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

  /* MAIN PAGE */

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

      {/* MOCK: confirm a booking to test the whole flow (dev only) */}

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
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  CalendarDays,
  Clock3,
  IndianRupee,
  Check,
  X,
  RefreshCw,
} from "lucide-react";

import { useJobs } from "@/hooks/useJobs";
import { partnerApi } from "@/services/partnerApi";
import type {
  JobTab,
  PartnerJob,
} from "@/types/partner";

import './index.css'

const PAGE_SIZE = 10;

const TABS: {
  key: JobTab;
  label: string;
}[] = [
  { key: "all", label: "All" },
  { key: "requests", label: "Requests" },
  { key: "upcoming", label: "Upcoming" },
  { key: "active", label: "Active" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const STATUS_LABELS: Record<JobTab, string> = {
  all: "All",
  requests: "Requested",
  upcoming: "Upcoming",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

function getInitialTab(pathname: string, search: string): JobTab {
  if (pathname.endsWith("/requests")) {
    return "requests";
  }

  const params = new URLSearchParams(search);
  const tab = params.get("tab");

  if (
    tab === "requests" ||
    tab === "upcoming" ||
    tab === "active" ||
    tab === "completed" ||
    tab === "cancelled"
  ) {
    return tab;
  }

  return "all";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatAmount(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

function getCountdown(expiresAt?: string): number {
  if (!expiresAt) {
    return 0;
  }

  const expiry = new Date(expiresAt).getTime();

  if (Number.isNaN(expiry)) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((expiry - Date.now()) / 1000)
  );
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function JobStatusBadge({
  status,
}: {
  status: PartnerJob["status"];
}) {
  const labels: Record<PartnerJob["status"], string> = {
    requested: "Requested",
    upcoming: "Upcoming",
    active: "Active",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`partner-job-status partner-job-status-${status}`}
    >
      {labels[status]}
    </span>
  );
}

function RequestCountdown({
  expiresAt,
}: {
  expiresAt?: string;
}) {
  const [seconds, setSeconds] = useState(() =>
    getCountdown(expiresAt)
  );

  useEffect(() => {
    setSeconds(getCountdown(expiresAt));

    if (!expiresAt) {
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds(getCountdown(expiresAt));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [expiresAt]);

  if (!expiresAt || seconds <= 0) {
    return (
      <span className="partner-job-countdown expired">
        Expired
      </span>
    );
  }

  return (
    <span className="partner-job-countdown">
      <Clock3 size={14} aria-hidden="true" />
      {formatCountdown(seconds)}
    </span>
  );
}

function JobActions({
  job,
  onAccept,
  onReject,
  accepting,
  rejecting,
}: {
  job: PartnerJob;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  accepting: boolean;
  rejecting: boolean;
}) {
  if (job.status !== "requested") {
    return (
      <span className="partner-job-no-action">
        —
      </span>
    );
  }

  const expired = getCountdown(job.expiresAt) <= 0;

  return (
    <div className="partner-job-actions">
      <button
        type="button"
        className="partner-job-action partner-job-action-reject"
        onClick={() => onReject(job.id)}
        disabled={accepting || rejecting}
        aria-label={`Reject ${job.service}`}
      >
        <X size={15} aria-hidden="true" />
        Reject
      </button>

      <button
        type="button"
        className="partner-job-action partner-job-action-accept"
        onClick={() => onAccept(job.id)}
        disabled={
          expired ||
          accepting ||
          rejecting
        }
        aria-label={`Accept ${job.service}`}
      >
        <Check size={15} aria-hidden="true" />
        Accept
      </button>
    </div>
  );
}

function JobCard({
  job,
  onAccept,
  onReject,
  accepting,
  rejecting,
}: {
  job: PartnerJob;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  accepting: boolean;
  rejecting: boolean;
}) {
  return (
    <article className="partner-job-card">
      <div className="partner-job-card-header">
        <div>
          <p className="partner-job-service">
            {job.service}
          </p>

          <p className="partner-job-booking">
            Booking ID: {job.bookingId}
          </p>
        </div>

        <JobStatusBadge status={job.status} />
      </div>

      {job.status === "requested" && (
        <div className="partner-job-request-time">
          <span>Response time</span>
          <RequestCountdown expiresAt={job.expiresAt} />
        </div>
      )}

      <div className="partner-job-card-details">
        <div className="partner-job-detail">
          <span className="partner-job-detail-icon">
            <span aria-hidden="true">●</span>
          </span>

          <div>
            <span className="partner-job-detail-label">
              Customer
            </span>
            <strong>{job.customer}</strong>
          </div>
        </div>

        <div className="partner-job-detail">
          <MapPin
            size={17}
            aria-hidden="true"
          />

          <div>
            <span className="partner-job-detail-label">
              Location
            </span>
            <strong>{job.location}</strong>
            <small>
              {job.distance.toFixed(1)} km away
            </small>
          </div>
        </div>

        <div className="partner-job-detail">
          <CalendarDays
            size={17}
            aria-hidden="true"
          />

          <div>
            <span className="partner-job-detail-label">
              Date
            </span>
            <strong>
              {formatDate(job.scheduledAt)}
            </strong>
          </div>
        </div>

        <div className="partner-job-detail">
          <Clock3
            size={17}
            aria-hidden="true"
          />

          <div>
            <span className="partner-job-detail-label">
              Time
            </span>
            <strong>
              {formatTime(job.scheduledAt)}
            </strong>
          </div>
        </div>

        <div className="partner-job-detail">
          <IndianRupee
            size={17}
            aria-hidden="true"
          />

          <div>
            <span className="partner-job-detail-label">
              Amount
            </span>
            <strong>
              {formatAmount(job.amount)}
            </strong>
          </div>
        </div>
      </div>

      {job.instructions && (
        <div className="partner-job-instructions">
          <span>Instructions</span>
          <p>{job.instructions}</p>
        </div>
      )}

      <div className="partner-job-card-footer">
        <JobActions
          job={job}
          onAccept={onAccept}
          onReject={onReject}
          accepting={accepting}
          rejecting={rejecting}
        />
      </div>
    </article>
  );
}

export const PartnerJobsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<JobTab>(() =>
    getInitialTab(
      location.pathname,
      location.search
    )
  );

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const nextTab = getInitialTab(
      location.pathname,
      location.search
    );

    setActiveTab(nextTab);
    setPage(1);
  }, [location.pathname, location.search]);

  const jobsQuery = useJobs(
    activeTab,
    search,
    page
  );

  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      partnerApi.acceptJob(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["partner", "jobs"],
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      partnerApi.rejectJob(id),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["partner", "jobs"],
      });
    },
  });

  const jobs = jobsQuery.data?.jobs ?? [];

  const total = jobsQuery.data?.total ?? 0;

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const visibleJobs = useMemo(
    () => jobs,
    [jobs]
  );

  const handleTabChange = (tab: JobTab) => {
    setActiveTab(tab);
    setPage(1);

    if (tab === "requests") {
      navigate("/partner/jobs/requests");
      return;
    }

    if (tab === "all") {
      navigate("/partner/jobs");
      return;
    }

    navigate(`/partner/jobs?tab=${tab}`);
  };

  const handleSearchChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const handleAccept = (id: string) => {
    acceptMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    rejectMutation.mutate(id);
  };

  const handleRetry = () => {
    void jobsQuery.refetch();
  };

  return (
    <main className="partner-jobs-page">
      <div className="partner-jobs-container">

        {/* Page header */}
        <header className="partner-jobs-header">
          <div>
            <h1>My Jobs</h1>
            <p>
              Manage job requests and your scheduled jobs.
            </p>
          </div>

          <button
            type="button"
            className="partner-jobs-refresh"
            onClick={handleRetry}
            disabled={jobsQuery.isFetching}
          >
            <RefreshCw
              size={17}
              className={
                jobsQuery.isFetching
                  ? "partner-spin"
                  : ""
              }
              aria-hidden="true"
            />
            Refresh
          </button>
        </header>

        {/* Tabs */}
        <nav
          className="partner-jobs-tabs"
          aria-label="Job status"
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={
                activeTab === tab.key
                  ? "partner-job-tab active"
                  : "partner-job-tab"
              }
              onClick={() =>
                handleTabChange(tab.key)
              }
              aria-current={
                activeTab === tab.key
                  ? "page"
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Search */}
        <section className="partner-jobs-toolbar">
          <div className="partner-jobs-search">
            <Search
              size={18}
              aria-hidden="true"
            />

            <label
              htmlFor="partner-job-search"
              className="sr-only"
            >
              Search jobs
            </label>

            <input
              id="partner-job-search"
              type="search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by booking ID, service or customer..."
              autoComplete="off"
            />
          </div>

          <div className="partner-jobs-count">
            {total}{" "}
            {total === 1 ? "job" : "jobs"}
          </div>
        </section>

        {/* Mutation error */}
        {(acceptMutation.isError ||
          rejectMutation.isError) && (
          <div
            className="partner-jobs-alert"
            role="alert"
          >
            <strong>
              Action could not be completed.
            </strong>
            <span>
              Please refresh the list and try again.
            </span>
          </div>
        )}

        {/* Loading */}
        {jobsQuery.isLoading && (
          <div
            className="partner-jobs-loading"
            role="status"
            aria-live="polite"
          >
            <div className="partner-jobs-spinner" />
            <p>Loading jobs...</p>
          </div>
        )}

        {/* Error */}
        {jobsQuery.isError && !jobsQuery.isLoading && (
          <div
            className="partner-jobs-error"
            role="alert"
          >
            <h2>Unable to load jobs</h2>

            <p>
              Something went wrong while loading your
              jobs. Please try again.
            </p>

            <button
              type="button"
              onClick={handleRetry}
              className="partner-jobs-primary-button"
            >
              <RefreshCw
                size={16}
                aria-hidden="true"
              />
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!jobsQuery.isLoading &&
          !jobsQuery.isError &&
          visibleJobs.length === 0 && (
            <div
              className="partner-jobs-empty"
              role="status"
            >
              <div className="partner-jobs-empty-icon">
                <CalendarDays
                  size={28}
                  aria-hidden="true"
                />
              </div>

              <h2>
                No {STATUS_LABELS[activeTab].toLowerCase()}{" "}
                jobs found
              </h2>

              <p>
                {search
                  ? "Try changing your search or clearing the search field."
                  : activeTab === "requests"
                    ? "New job requests will appear here when they are available."
                    : "There are no jobs in this category yet."}
              </p>

              {search && (
                <button
                  type="button"
                  className="partner-jobs-secondary-button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          )}

        {/* Desktop table */}
        {!jobsQuery.isLoading &&
          !jobsQuery.isError &&
          visibleJobs.length > 0 && (
            <>
              <section className="partner-jobs-table-section">
                <div className="partner-jobs-table-wrapper">
                  <table className="partner-jobs-table">
                    <thead>
                      <tr>
                        <th scope="col">
                          Booking
                        </th>
                        <th scope="col">
                          Service
                        </th>
                        <th scope="col">
                          Customer
                        </th>
                        <th scope="col">
                          Location
                        </th>
                        <th scope="col">
                          Date &amp; Time
                        </th>
                        <th scope="col">
                          Amount
                        </th>
                        <th scope="col">
                          Status
                        </th>
                        <th scope="col">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleJobs.map((job) => (
                        <tr key={job.id}>
                          <td>
                            <span className="partner-job-id">
                              {job.bookingId}
                            </span>
                          </td>

                          <td>
                            <div className="partner-job-service-cell">
                              <strong>
                                {job.service}
                              </strong>

                              {job.instructions && (
                                <small>
                                  {job.instructions}
                                </small>
                              )}
                            </div>
                          </td>

                          <td>
                            {job.customer}
                          </td>

                          <td>
                            <div className="partner-job-location-cell">
                              <span>
                                {job.location}
                              </span>

                              <small>
                                {job.distance.toFixed(1)} km
                              </small>
                            </div>
                          </td>

                          <td>
                            <div className="partner-job-datetime">
                              <span>
                                {formatDate(
                                  job.scheduledAt
                                )}
                              </span>

                              <small>
                                {formatTime(
                                  job.scheduledAt
                                )}
                              </small>
                            </div>
                          </td>

                          <td>
                            <strong>
                              {formatAmount(
                                job.amount
                              )}
                            </strong>
                          </td>

                          <td>
                            <div className="partner-job-status-cell">
                              <JobStatusBadge
                                status={job.status}
                              />

                              {job.status ===
                                "requested" && (
                                <RequestCountdown
                                  expiresAt={
                                    job.expiresAt
                                  }
                                />
                              )}
                            </div>
                          </td>

                          <td>
                            <JobActions
                              job={job}
                              onAccept={
                                handleAccept
                              }
                              onReject={
                                handleReject
                              }
                              accepting={
                                acceptMutation.isPending
                              }
                              rejecting={
                                rejectMutation.isPending
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Mobile cards */}
              <section
                className="partner-jobs-cards"
                aria-label="Jobs list"
              >
                {visibleJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    accepting={
                      acceptMutation.isPending
                    }
                    rejecting={
                      rejectMutation.isPending
                    }
                  />
                ))}
              </section>

              {/* Pagination */}
              <div className="partner-jobs-pagination">
                <span>
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <div className="partner-jobs-pagination-buttons">
                  <button
                    type="button"
                    disabled={
                      currentPage === 1 ||
                      jobsQuery.isFetching
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.max(
                          1,
                          current - 1
                        )
                      )
                    }
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={
                      currentPage ===
                        totalPages ||
                      jobsQuery.isFetching
                    }
                    onClick={() =>
                      setPage((current) =>
                        Math.min(
                          totalPages,
                          current + 1
                        )
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
      </div>
    </main>
  );
};

export default PartnerJobsPage;
