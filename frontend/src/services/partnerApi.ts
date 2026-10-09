import http, { type ApiResponse } from "@/lib/http";

import {
  mockDashboard,
  mockEarningsSummary,
  mockJobRequests,
  mockNotifications,
} from "@/mocks/partnerDashboard";

import type {
  ActiveJob,
  EarningsSummary,
  JobMutationResult,
  JobRequest,
  JobTab,
  JobsResponse,
  PartnerDashboard,
  PartnerJob,
  PartnerNotification,
} from "@/types/partner";

import {
  PARTNER_DETAILS,
  type PartnerDetails,
  type AccountStatus,
} from "../mocks/partnerDetails";

/* =========================================================
   Existing Partner Profile / KYC / Status types
   ========================================================= */

export interface PartnerProfileInput {
  name: string;
  phone: string;
}

export type { ActiveJob, EarningsSummary, JobRequest, PartnerDashboard, PartnerNotification };

export type KycDecision =
  | "approve"
  | "reject";

export interface KycUpdatePayload {
  decision: KycDecision;
  reason?: string;
}

export interface StatusUpdatePayload {
  status: AccountStatus;
}

export interface PartnerMutationResult {
  success: boolean;
  message: string;
  partner: PartnerDetails;
}

/* =========================================================
   Mock storage helpers
   ========================================================= */

const STORAGE_PREFIX = "homecarex:partner:";

/* =========================================================
   STORAGE
========================================================= */

// const STORAGE_PREFIX =
//   "homecarex:partner:";

/* =========================================================
   HELPERS
========================================================= */

const delay = (
  milliseconds: number,
) =>
  new Promise<void>((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds,
    );
  });

const getStorageKey = (
  id: string,
): string =>
  `${STORAGE_PREFIX}${id}`;

/* =========================================================
   SAVE PARTNER
========================================================= */

const savePartner = (
  partner: PartnerDetails,
): void => {
  window.localStorage.setItem(
    getStorageKey(partner.id),
    JSON.stringify(partner),
  );
};

/* =========================================================
   GET STORED PARTNER
========================================================= */

const getStoredPartner = (
  id: string,
): PartnerDetails | null => {
  const storedPartner =
    window.localStorage.getItem(
      getStorageKey(id),
    );

  if (!storedPartner) {
    return null;
  }

  try {
    return JSON.parse(
      storedPartner,
    ) as PartnerDetails;
  } catch {
    window.localStorage.removeItem(
      getStorageKey(id),
    );

    return null;
  }
};

/* =========================================================
   GET MOCK PARTNER
========================================================= */

const getMockPartner = (
  id: string,
): PartnerDetails | null => {
  const partner =
    PARTNER_DETAILS.find(
      (item) => item.id === id,
    );

  if (!partner) {
    return null;
  }

  return structuredClone(partner);
};

/* =========================================================
   GET CURRENT PARTNER
========================================================= */

const getCurrentPartner = (
  id: string,
): PartnerDetails | null => {
  const storedPartner =
    getStoredPartner(id);

  if (storedPartner) {
    return storedPartner;
  }

  return getMockPartner(id);
};

/* =========================================================
   Existing Partner Details APIs
   ========================================================= */

export async function getPartnerById(
  id: string,
): Promise<PartnerDetails | null> {
  await delay(500);

  const partner =
    getCurrentPartner(id);

  if (!partner) {
    return null;
  }

  return structuredClone(partner);
}

/* =========================================================
   UPDATE PARTNER KYC
========================================================= */

export async function updatePartnerKyc(
  id: string,
  payload: KycUpdatePayload,
): Promise<PartnerMutationResult> {
  await delay(500);

  const partner =
    getCurrentPartner(id);

  if (!partner) {
    throw new Error(
      "Partner not found.",
    );
  }

  /* REJECT */

  if (
    payload.decision === "reject"
  ) {
    const reason =
      payload.reason?.trim();

    if (!reason) {
      throw new Error(
        "Rejection reason is required.",
      );
    }

    partner.kycStatus = "Rejected";

    partner.kyc.reviewedAt =
      new Date().toISOString();

    savePartner(partner);

    return {
      success: true,
      message:
        "Partner KYC rejected.",
      partner:
        structuredClone(partner),
    };
  }

  /* APPROVE */

  partner.kycStatus = "Approved";

  partner.kyc.reviewedAt =
    new Date().toISOString();

  partner.kyc.checklist =
    partner.kyc.checklist.map(
      (item) => ({
        ...item,
        completed: true,
      }),
    );

  savePartner(partner);

  return {
    success: true,
    message:
      "Partner KYC approved.",
    partner:
      structuredClone(partner),
  };
}

/* =========================================================
   UPDATE PARTNER STATUS
========================================================= */

export async function updatePartnerStatus(
  id: string,
  payload: StatusUpdatePayload,
): Promise<PartnerMutationResult> {
  await delay(500);

  const partner =
    getCurrentPartner(id);

  if (!partner) {
    throw new Error(
      "Partner not found.",
    );
  }

  partner.accountStatus =
    payload.status;

  savePartner(partner);

  return {
    success: true,
    message: `Partner status changed to ${payload.status}.`,
    partner:
      structuredClone(partner),
  };
}

/* =========================================================
   NOTIFY PARTNER
========================================================= */

export async function notifyPartner(
  id: string,
  message: string,
): Promise<void> {
  await delay(200);

  console.info(
    `[MOCK NOTIFY] ${id}: ${message}`,
  );
}

/* =========================================================
   PARTNER AUDIT
========================================================= */

export async function recordPartnerAudit(
  id: string,
  action: string,
  details: Record<string, string>,
): Promise<void> {
  await delay(100);

  console.info(
    "[MOCK AUDIT]",
    JSON.stringify({
      partnerId: id,
      action,
      details,
      timestamp:
        new Date().toISOString(),
    }),
  );
}

/* =========================================================

const USE_MOCKS =
  String(
    import.meta.env
      .VITE_USE_MOCKS ?? "true",
  ) !== "false";

// /* =========================================================
//    PARTNER API

// export const partnerApi = {
//   /* DASHBOARD */
//    P02 - Partner Jobs / My Jobs
//    ========================================================= */

/**
 * Mocks are ON unless VITE_USE_MOCKS=false.
 *
 * P02 currently has no backend task for this day,
 * so jobs use local mock data while the backend endpoint
 * is not available.
 */
const USE_MOCKS =
  String(
    import.meta.env.VITE_USE_MOCKS ?? "true"
  ) !== "false";

/**
 * Mock jobs used by the P02 My Jobs page.
 *
 * These are kept here so the Jobs page can be developed
 * and tested before GET /partner/jobs is available.
 */
const MOCK_PARTNER_JOBS: PartnerJob[] = [
  {
    id: "job-001",
    bookingId: "HCX-10001",
    service: "Deep Home Cleaning",
    customer: "Rahul Sharma",
    location: "Gachibowli, Hyderabad",
    distance: 2.4,
    scheduledAt: "2026-10-08T14:00:00+05:30",
    amount: 1499,
    status: "requested",
    instructions:
      "Please call the customer before arriving.",
    expiresAt: new Date(
      Date.now() + 60 * 1000
    ).toISOString(),
  },
  {
    id: "job-002",
    bookingId: "HCX-10002",
    service: "Washing Machine Repair",
    customer: "Priya Reddy",
    location: "Kondapur, Hyderabad",
    distance: 4.1,
    scheduledAt: "2026-10-09T10:30:00+05:30",
    amount: 599,
    status: "upcoming",
    instructions:
      "Customer reported unusual vibration.",
  },
  {
    id: "job-003",
    bookingId: "HCX-10003",
    service: "AC Service",
    customer: "Arjun Kumar",
    location: "Madhapur, Hyderabad",
    distance: 5.2,
    scheduledAt: "2026-10-08T12:30:00+05:30",
    amount: 899,
    status: "active",
    instructions:
      "Check cooling performance and clean filters.",
  },
  {
    id: "job-004",
    bookingId: "HCX-10004",
    service: "Kitchen Cleaning",
    customer: "Sneha Patel",
    location: "Jubilee Hills, Hyderabad",
    distance: 7.8,
    scheduledAt: "2026-10-05T11:00:00+05:30",
    amount: 1299,
    status: "completed",
    instructions:
      "Focus on kitchen cabinets and chimney area.",
  },
  {
    id: "job-005",
    bookingId: "HCX-10005",
    service: "Plumbing Repair",
    customer: "Vikram Singh",
    location: "Manikonda, Hyderabad",
    distance: 6.3,
    scheduledAt: "2026-10-04T15:30:00+05:30",
    amount: 749,
    status: "cancelled",
    instructions:
      "Customer cancelled the booking.",
  },
];

/**
 * Converts the UI tab "requests" to the backend/mock
 * status "requested".
 */
const matchesJobTab = (
  job: PartnerJob,
  tab: JobTab
): boolean => {
  if (tab === "all") {
    return true;
  }

  if (tab === "requests") {
    return job.status === "requested";
  }

  return job.status === tab;
};

/**
 * GET /partner/jobs
 *
 * Backend contract:
 * GET /partner/jobs?tab=all|requests|upcoming|active|completed|cancelled
 *
 * For now, because P02 has no backend task today,
 * this function uses mock data when mocks are enabled.
 */
async function getJobs(
  tab: JobTab = "all",
  page = 1,
  limit = 10,
  search = ""
): Promise<JobsResponse> {
  if (!USE_MOCKS) {
    const res = await http.get<
      ApiResponse<JobsResponse>
    >("/partner/jobs", {
      params: {
        tab,
        page,
        limit,
        ...(search.trim()
          ? { search: search.trim() }
          : {}),
      },
    });

    return res.data.data;
  }

  await delay(400);

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredJobs =
    MOCK_PARTNER_JOBS.filter((job) => {
      const matchesTab = matchesJobTab(
        job,
        tab
      );

      if (!matchesTab) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        job.bookingId,
        job.service,
        job.customer,
        job.location,
        job.status,
      ].some((value) =>
        value
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });

  const startIndex =
    (page - 1) * limit;

  const paginatedJobs =
    filteredJobs.slice(
      startIndex,
      startIndex + limit
    );

  return {
    jobs: paginatedJobs.map((job) =>
      structuredClone(job)
    ),
    total: filteredJobs.length,
    page,
    limit,
  };
}

/**
 * Accept a partner job.
 *
 * Backend contract:
 * POST /partner/jobs/:id/accept
 *
 * Until the backend endpoint is available, this updates
 * the mock job in memory for the current browser session.
 */
async function acceptJob(
  id: string
): Promise<JobMutationResult> {
  if (!USE_MOCKS) {
    const res = await http.post<
      ApiResponse<JobMutationResult>
    >(`/partner/jobs/${id}/accept`);

    return res.data.data;
  }

  await delay(400);

  const jobIndex =
    MOCK_PARTNER_JOBS.findIndex(
      (job) => job.id === id
    );

  if (jobIndex === -1) {
    throw new Error("Job not found.");
  }

  const job =
    MOCK_PARTNER_JOBS[jobIndex];

  if (job.status !== "requested") {
    throw new Error(
      "This job is no longer available."
    );
  }

  if (
    job.expiresAt &&
    new Date(job.expiresAt).getTime() <=
      Date.now()
  ) {
    throw new Error(
      "This job request has expired."
    );
  }

  MOCK_PARTNER_JOBS[jobIndex] = {
    ...job,
    status: "upcoming",
  };

  return {
    success: true,
    message: "Job accepted successfully.",
  };
}

/**
 * Reject a partner job.
 *
 * Backend contract:
 * POST /partner/jobs/:id/reject
 *
 * Until the backend endpoint is available, this removes
 * the job from the request state by marking it cancelled.
 */
async function rejectJob(
  id: string
): Promise<JobMutationResult> {
  if (!USE_MOCKS) {
    const res = await http.post<
      ApiResponse<JobMutationResult>
    >(`/partner/jobs/${id}/reject`);

    return res.data.data;
  }

  await delay(400);

  const jobIndex =
    MOCK_PARTNER_JOBS.findIndex(
      (job) => job.id === id
    );

  if (jobIndex === -1) {
    throw new Error("Job not found.");
  }

  const job =
    MOCK_PARTNER_JOBS[jobIndex];

  if (job.status !== "requested") {
    throw new Error(
      "This job is no longer available."
    );
  }

  MOCK_PARTNER_JOBS[jobIndex] = {
    ...job,
    status: "cancelled",
  };

  return {
    success: true,
    message: "Job rejected successfully.",
  };
}

/* =========================================================
   Partner API
   ========================================================= */

export const partnerApi = {
  /* -------------------------------------------------------
     Dashboard
     ------------------------------------------------------- */

  async getDashboard(): Promise<PartnerDashboard> {
    if (USE_MOCKS) {
      return mockDashboard();
    }

    const res =
      await http.get<
        ApiResponse<PartnerDashboard>
      >("/partner/dashboard");

    return res.data.data;
  },

  /* -------------------------------------------------------
     Job Requests
     ------------------------------------------------------- */

  async getJobRequests(): Promise<JobRequest[]> {
    return mockJobRequests();
  },

  /* -------------------------------------------------------
     P02 - My Jobs
     ------------------------------------------------------- */

  async getJobs(
    tab: JobTab = "all",
    page = 1,
    limit = 10,
    search = ""
  ): Promise<JobsResponse> {
    return getJobs(
      tab,
      page,
      limit,
      search
    );
  },

  async acceptJob(
    id: string
  ): Promise<JobMutationResult> {
    return acceptJob(id);
  },

  async rejectJob(
    id: string
  ): Promise<JobMutationResult> {
    return rejectJob(id);
  },

  /* -------------------------------------------------------
     Earnings
     ------------------------------------------------------- */

  async getEarningsSummary(): Promise<EarningsSummary> {
    if (USE_MOCKS) {
      return mockEarningsSummary();
    }

    const res =
      await http.get<
        ApiResponse<EarningsSummary>
      >(
        "/partner/earnings/summary",
      );

    return res.data.data;
  },

  /* -------------------------------------------------------
     Profile
     ------------------------------------------------------- */

  async updateProfile(
    input: PartnerProfileInput
  ): Promise<PartnerProfileInput> {
    await new Promise<void>(
      (resolve) =>
        setTimeout(resolve, 500)
    );

    return input;
  },

  /* -------------------------------------------------------
     Notifications
     ------------------------------------------------------- */

  async getNotifications(): Promise<PartnerNotification[]> {
    return mockNotifications();
  },
};