export interface ActiveJobDto {
  id: string;
  service: string;
  customer: string;
  address: string;
  status: 'en_route' | 'arrived' | 'in_progress';
  scheduledAt: string;
}

/** GET /api/v1/partner/dashboard -> data */
export interface PartnerDashboardDto {
  newJobs: number;
  todayJobs: number;
  completedJobs: number;
  todayEarnings: number;
  rating: number;
  acceptanceRate: number;
  completionRate: number;
  activeJob: ActiveJobDto | null;
}