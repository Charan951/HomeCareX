import http, { type ApiResponse } from "@/lib/http";
import { mockDashboard, mockEarningsSummary, mockJobRequests, mockNotifications } from "@/mocks/partnerDashboard";
import type { EarningsSummary, JobRequest, PartnerDashboard, PartnerNotification } from "@/types/partner";

export interface PartnerProfileInput {
  name: string;
  phone: string;
}

export type { ActiveJob, EarningsSummary, JobRequest, PartnerDashboard, PartnerNotification } from "@/types/partner";
import {
  PARTNER_DETAILS,
  PartnerDetails,
  AccountStatus,
} from "../mocks/partnerDetails";

export type KycDecision = "approve" | "reject";

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

const STORAGE_PREFIX = "homecarex:partner:";

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds);
  });

const getStorageKey = (id: string): string =>
  `${STORAGE_PREFIX}${id}`;

const savePartner = (partner: PartnerDetails): void => {
  window.localStorage.setItem(
    getStorageKey(partner.id),
    JSON.stringify(partner)
  );
};

const getStoredPartner = (
  id: string
): PartnerDetails | null => {
  const storedPartner = window.localStorage.getItem(
    getStorageKey(id)
  );

  if (!storedPartner) {
    return null;
  }

  try {
    return JSON.parse(
      storedPartner
    ) as PartnerDetails;
  } catch {
    window.localStorage.removeItem(
      getStorageKey(id)
    );

    return null;
  }
};

const getMockPartner = (
  id: string
): PartnerDetails | null => {
  const partner = PARTNER_DETAILS.find(
    (item) => item.id === id
  );

  if (!partner) {
    return null;
  }

  return structuredClone(partner);
};

const getCurrentPartner = (
  id: string
): PartnerDetails | null => {
  const storedPartner =
    getStoredPartner(id);

  if (storedPartner) {
    return storedPartner;
  }

  return getMockPartner(id);
};

export async function getPartnerById(
  id: string
): Promise<PartnerDetails | null> {
  await delay(500);

  const partner = getCurrentPartner(id);

  if (!partner) {
    return null;
  }

  return structuredClone(partner);
}

export async function updatePartnerKyc(
  id: string,
  payload: KycUpdatePayload
): Promise<PartnerMutationResult> {
  await delay(500);

  const partner = getCurrentPartner(id);

  if (!partner) {
    throw new Error("Partner not found.");
  }

  if (payload.decision === "reject") {
    const reason = payload.reason?.trim();

    if (!reason) {
      throw new Error(
        "Rejection reason is required."
      );
    }

    partner.kycStatus = "Rejected";

    partner.kyc.reviewedAt =
      new Date().toISOString();

    savePartner(partner);

    return {
      success: true,
      message: "Partner KYC rejected.",
      partner: structuredClone(partner),
    };
  }

  partner.kycStatus = "Approved";

  partner.kyc.reviewedAt =
    new Date().toISOString();

  partner.kyc.checklist =
    partner.kyc.checklist.map((item) => ({
      ...item,
      completed: true,
    }));

  savePartner(partner);

  return {
    success: true,
    message: "Partner KYC approved.",
    partner: structuredClone(partner),
  };
}

export async function updatePartnerStatus(
  id: string,
  payload: StatusUpdatePayload
): Promise<PartnerMutationResult> {
  await delay(500);

  const partner = getCurrentPartner(id);

  if (!partner) {
    throw new Error("Partner not found.");
  }

  partner.accountStatus =
    payload.status;

  savePartner(partner);

  return {
    success: true,
    message: `Partner status changed to ${payload.status}.`,
    partner: structuredClone(partner),
  };
}

export async function notifyPartner(
  id: string,
  message: string
): Promise<void> {
  await delay(200);

  console.info(
    `[MOCK NOTIFY] ${id}: ${message}`
  );
}

export async function recordPartnerAudit(
  id: string,
  action: string,
  details: Record<string, string>
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
    })
  );
}



/** Mocks are ON unless VITE_USE_MOCKS=false. Requests, earnings and notifications have no backend endpoint yet. */
const USE_MOCKS = String(import.meta.env.VITE_USE_MOCKS ?? "true") !== "false";

export const partnerApi = {
  async getDashboard(): Promise<PartnerDashboard> {
    if (USE_MOCKS) return mockDashboard();
    const res = await http.get<ApiResponse<PartnerDashboard>>("/partner/dashboard");
    return res.data.data;
  },
  // TODO(backend): GET /partner/job-requests
  async getJobRequests(): Promise<JobRequest[]> {
    return mockJobRequests();
  },
  // TODO(backend): GET /partner/earnings/summary
  async getEarningsSummary(): Promise<EarningsSummary> {
    return mockEarningsSummary();
  },
  // TODO(backend): PATCH /partner/profile  (no endpoint yet, so this only simulates a save)
  async updateProfile(input: PartnerProfileInput): Promise<PartnerProfileInput> {
    await new Promise((r) => setTimeout(r, 500));
    return input;
  },
  // TODO(backend): GET /partner/notifications
  async getNotifications(): Promise<PartnerNotification[]> {
    return mockNotifications();
  },
};
