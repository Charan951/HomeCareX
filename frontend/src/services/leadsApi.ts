import http, { type ApiResponse } from '@/lib/http';
import type { LeadStatus, LeadSource } from '@/features/public/leads';

export interface AdminLead {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  city: string;
  message?: string;
  skills?: string[];
  source: LeadSource;
  status: LeadStatus;
  createdAt: string;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  closed: number;
  partnerInterests: number;
}

export interface AdminLeadsResponse {
  leads: AdminLead[];
  pagination: { page: number; limit: number; total: number; pages: number };
  stats: LeadStats;
}

export const fetchLeads = async (params: {
  page: number;
  search?: string;
  source?: LeadSource | '';
  status?: LeadStatus | '';
}): Promise<AdminLeadsResponse> => {
  const query = {
    page: params.page,
    ...(params.search ? { search: params.search } : {}),
    ...(params.source ? { source: params.source } : {}),
    ...(params.status ? { status: params.status } : {}),
  };
  const response = await http.get<ApiResponse<AdminLeadsResponse>>('/admin/leads', { params: query });
  return response.data.data;
};

export const fetchLead = async (id: string): Promise<AdminLead> => {
  const response = await http.get<ApiResponse<AdminLead>>(`/admin/leads/${id}`);
  return response.data.data;
};

export const updateLeadStatus = async (input: { id: string; status: LeadStatus }): Promise<AdminLead> => {
  const response = await http.patch<ApiResponse<AdminLead>>(`/admin/leads/${input.id}/status`, { status: input.status });
  return response.data.data;
};
