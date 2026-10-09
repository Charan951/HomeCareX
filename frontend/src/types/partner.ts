export interface ActiveJob {
  id: string;
  service: string;
  customer: string;
  address: string;
  status: "en_route" | "arrived" | "in_progress";
  scheduledAt: string;
}

/** GET /partner/dashboard */
export interface PartnerDashboard {
  newJobs: number;
  todayJobs: number;
  completedJobs: number;
  todayEarnings: number;
  rating: number;
  acceptanceRate: number;
  completionRate: number;
  activeJob: ActiveJob | null;
}

/** A job offer waiting for the partner's accept/reject. */
export interface JobRequest {
  id: string;
  service: string;
  area: string;
  /** Full street address. Shown to the partner only after they accept. */
  address?: string;
  price: number;
  scheduledAt: string;
  /** ISO time after which the offer can no longer be accepted. */
  expiresAt: string;
}

export interface PartnerNotification {
  id: string;
  title: string;
  createdAt: string;
  read: boolean;
}

export interface EarningsSummary {
  today: number;
  week: number;
  month: number;
}