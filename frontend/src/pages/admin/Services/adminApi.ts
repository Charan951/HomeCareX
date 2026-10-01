import http, { type ApiResponse } from '@/lib/http';

export interface PartnerMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  designation?: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

export interface CreatePartnerInput {
  name: string;
  email: string;
  designation: string;
  phone: string;
  gender: string;
  password: string;
}

/** Edit form: send only the fields that changed. */
export type UpdatePartnerInput = Partial<Omit<CreatePartnerInput, 'password' | 'gender'>> & {
  gender?: 'male' | 'female' | 'other';
  status?: 'active' | 'blocked';
};

export interface Designation {
  id: string;
  name: string;
  /** How many partners currently have this designation. */
  partners: number;
}

export interface AdminStats {
  partners: number;
  customers: number;
}

// ---- dashboard ----
export type DatePreset = 'today' | '7d' | '30d' | '90d' | 'this_month' | 'last_month';

/** Use `preset`, or `from` + `to` (YYYY-MM-DD, max 365 days). `city` is optional. */
export interface DashboardParams {
  preset?: DatePreset;
  from?: string;
  to?: string;
  city?: string;
}

export interface Kpi {
  value: number;
  /** Percent vs previous period. null when there is nothing to compare with. */
  delta: number | null;
}

export interface DashboardSummary {
  range: { from: string; to: string; days: number; previousFrom: string; previousTo: string };
  city: string | null;
  kpis: { gmv: Kpi; bookings: Kpi; activeCustomers: Kpi; activePartners: Kpi; cancellationRate: Kpi };
  snapshot: {
    pendingApprovals: number;
    openTickets: number;
    payoutBacklog: { count: number; amount: number };
    refundQueue: { count: number; amount: number };
  };
  filters: { cities: string[] };
}

export interface DashboardTrends {
  range: { from: string; to: string; days: number; granularity: 'day' | 'week' };
  city: string | null;
  series: { date: string; bookings: number; gmv: number; revenue: number }[];
  categories: { categoryId: string | null; name: string; bookings: number; gmv: number }[];
  funnel: { stage: string; label: string; count: number; percentOfRequested: number }[];
}

const clean = (p: DashboardParams) => Object.fromEntries(Object.entries(p).filter(([, v]) => v));

export const adminApi = {
  getStats: () => http.get<ApiResponse<AdminStats>>('/admin/partners/stats').then((r) => r.data.data),

  getDashboardSummary: (params: DashboardParams = {}) =>
    http.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary', { params: clean(params) }).then((r) => r.data.data),

  getDashboardTrends: (params: DashboardParams = {}) =>
    http.get<ApiResponse<DashboardTrends>>('/admin/dashboard/trends', { params: clean(params) }).then((r) => r.data.data),

  listPartners: () => http.get<ApiResponse<PartnerMember[]>>('/admin/partners').then((r) => r.data.data),

  createPartner: (input: CreatePartnerInput) =>
    http
      .post<ApiResponse<{ partner: PartnerMember; emailSent: boolean }>>('/admin/partners', input)
      .then((r) => r.data.data),

  updatePartner: (id: string, input: UpdatePartnerInput) =>
    http.patch<ApiResponse<PartnerMember>>(`/admin/partners/${id}`, input).then((r) => r.data.data),

  deletePartner: (id: string) => http.delete<ApiResponse<{ ok: true }>>(`/admin/partners/${id}`).then((r) => r.data.data),

  listDesignations: () => http.get<ApiResponse<Designation[]>>('/admin/designations').then((r) => r.data.data),

  createDesignation: (name: string) =>
    http.post<ApiResponse<Designation>>('/admin/designations', { name }).then((r) => r.data.data),

  renameDesignation: (id: string, name: string) =>
    http.patch<ApiResponse<Designation>>(`/admin/designations/${id}`, { name }).then((r) => r.data.data),

  deleteDesignation: (id: string) =>
    http.delete<ApiResponse<{ ok: true }>>(`/admin/designations/${id}`).then((r) => r.data.data),
};
