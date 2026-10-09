import http, {
  type ApiResponse,
} from "@/lib/http";

import {
  mockDashboard,
  mockEarningsSummary,
  mockNotifications,
} from "@/mocks/partnerDashboard";

import {
  mockJobRequests,
} from "@/services/mockPartnerJobs";

import {
  acceptMockJob,
  rejectMockJob,
  type MockJobActionResult,
} from "@/services/mockPartnerJobActions";

import type {
  ActiveJob,
  EarningsSummary,
  JobRequest,
  PartnerDashboard,
  PartnerNotification,
} from "@/types/partner";

import {
  PARTNER_DETAILS,
  type PartnerDetails,
  type AccountStatus,
} from "@/mocks/partnerDetails";

/* =========================================================
   TYPES
========================================================= */

export interface PartnerProfileInput {
  name: string;
  phone: string;
}

export type {
  ActiveJob,
  EarningsSummary,
  JobRequest,
  PartnerDashboard,
  PartnerNotification,
} from "@/types/partner";

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

/** Result of POST /partner/jobs/:id/accept or /reject */
export type JobActionResult = Pick<
  MockJobActionResult,
  "status" | "message"
>;

/* =========================================================
   STORAGE
========================================================= */

const STORAGE_PREFIX =
  "homecarex:partner:";

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
   GET PARTNER BY ID
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
   MOCK CONFIGURATION

   Mocks are ON by default. To use the backend later set
   VITE_USE_MOCKS=false
========================================================= */

const USE_MOCKS =
  String(
    import.meta.env
      .VITE_USE_MOCKS ?? "true",
  ) !== "false";

/* =========================================================
   PARTNER API
========================================================= */

export const partnerApi = {
  /* DASHBOARD */

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
     JOB REQUESTS

     Backend later: GET /partner/job-requests
     (the backend knows the partner from the login token)
  ------------------------------------------------------- */

  async getJobRequests(
    partnerId?: string,
  ): Promise<JobRequest[]> {
    if (USE_MOCKS) {
      return mockJobRequests(partnerId);
    }

    const res =
      await http.get<
        ApiResponse<JobRequest[]>
      >("/partner/job-requests");

    return res.data.data;
  },

  /* -------------------------------------------------------
     ACCEPT JOB

     POST /partner/jobs/:id/accept
       200 → you got the job (first wins)
       404 → no such job for you
       409 → expired, rejected, taken, or not eligible
  ------------------------------------------------------- */

  async acceptJob(
    id: string,
    partnerId: string,
  ): Promise<JobActionResult> {
    if (USE_MOCKS) {
      return acceptMockJob(id, partnerId);
    }

    /* validateStatus lets 404 / 409 come back as results.
       This assumes @/lib/http is an axios instance. */
    const res = await http.post(
      `/partner/jobs/${id}/accept`,
      undefined,
      { validateStatus: () => true },
    );

    return {
      status: res.status,
      message: res.data?.message ?? "",
    };
  },

  /* -------------------------------------------------------
     REJECT JOB

     POST /partner/jobs/:id/reject  →  200 | 404 | 409
  ------------------------------------------------------- */

  async rejectJob(
    id: string,
    partnerId: string,
  ): Promise<JobActionResult> {
    if (USE_MOCKS) {
      return rejectMockJob(id, partnerId);
    }

    const res = await http.post(
      `/partner/jobs/${id}/reject`,
      undefined,
      { validateStatus: () => true },
    );

    return {
      status: res.status,
      message: res.data?.message ?? "",
    };
  },

  /* EARNINGS SUMMARY */

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

  /* UPDATE PROFILE */

  async updateProfile(
    input: PartnerProfileInput,
  ): Promise<PartnerProfileInput> {
    if (USE_MOCKS) {
      await delay(500);
      return input;
    }

    const res =
      await http.patch<
        ApiResponse<PartnerProfileInput>
      >(
        "/partner/profile",
        input,
      );

    return res.data.data;
  },

  /* NOTIFICATIONS */

  async getNotifications(): Promise<
    PartnerNotification[]
  > {
    if (USE_MOCKS) {
      return mockNotifications();
    }

    const res =
      await http.get<
        ApiResponse<PartnerNotification[]>
      >(
        "/partner/notifications",
      );

    return res.data.data;
  },
};