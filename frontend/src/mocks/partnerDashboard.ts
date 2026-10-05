import type { EarningsSummary, JobRequest, PartnerDashboard, PartnerNotification } from "@/types/partner";

/**
 * Mock data for the Partner dashboard (Day 2, before the API is wired).
 * Try states in dev with a URL param: /partner?mock=empty | error | slow
 */
type Scenario = "ok" | "empty" | "error" | "slow";

const scenario = (): Scenario => {
  const v = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("mock") : null;
  return v === "empty" || v === "error" || v === "slow" ? v : "ok";
};
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

export async function mockDashboard(): Promise<PartnerDashboard> {
  const s = scenario();
  await wait(s === "slow" ? 4000 : 400);
  if (s === "error") throw new Error("Could not load your dashboard.");
  if (s === "empty") {
    return { newJobs: 0, todayJobs: 0, completedJobs: 0, todayEarnings: 0, rating: 0, acceptanceRate: 0, completionRate: 0, activeJob: null };
  }
  return {
    newJobs: 2,
    todayJobs: 4,
    completedJobs: 2,
    todayEarnings: 2350,
    rating: 4.7,
    acceptanceRate: 92,
    completionRate: 97,
    activeJob: {
      id: "64b0000000000000000000a1",
      service: "AC service",
      customer: "Anita R.",
      address: "Madhapur, Hyderabad",
      status: "en_route",
      scheduledAt: inMinutes(20),
    },
  };
}

export async function mockJobRequests(): Promise<JobRequest[]> {
  const s = scenario();
  await wait(s === "slow" ? 4000 : 400);
  if (s === "error") throw new Error("Could not load job requests.");
  if (s === "empty") return [];
  return [
    { id: "r1", service: "Deep home cleaning", area: "Gachibowli", price: 1499, scheduledAt: inMinutes(90), expiresAt: inMinutes(1) },
    { id: "r2", service: "Washing machine repair", area: "Kondapur", price: 599, scheduledAt: inMinutes(180), expiresAt: inMinutes(3) },
  ];
}

export async function mockNotifications(): Promise<PartnerNotification[]> {
  const s = scenario();
  await wait(s === "slow" ? 4000 : 400);
  if (s === "error") throw new Error("Could not load notifications.");
  if (s === "empty") return [];
  return [
    { id: "n1", title: "New job request in Gachibowli", createdAt: inMinutes(-2), read: false },
    { id: "n2", title: "Payout of ₹8,450 processed", createdAt: inMinutes(-180), read: true },
    { id: "n3", title: "Training module due Friday", createdAt: inMinutes(-1440), read: true },
  ];
}

export async function mockEarningsSummary(): Promise<EarningsSummary> {
  const s = scenario();
  await wait(s === "slow" ? 4000 : 400);
  if (s === "error") throw new Error("Could not load earnings.");
  if (s === "empty") return { today: 0, week: 0, month: 0 };
  return { today: 2350, week: 11900, month: 38200 };
}