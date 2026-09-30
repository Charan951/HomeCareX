import http, { type ApiResponse } from '@/lib/http';

export const PARTNER_DESIGNATIONS = [
  'Plumber',
  'Electrician',
  'Cleaner',
  'Painter',
  'Appliance Repair',
  'Maintenance',
] as const;

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

export interface AdminStats {
  partners: number;
  customers: number;
}

export const adminApi = {
  getStats: () => http.get<ApiResponse<AdminStats>>('/admin/partners/stats').then((r) => r.data.data),

  listPartners: () => http.get<ApiResponse<PartnerMember[]>>('/admin/partners').then((r) => r.data.data),

  createPartner: (input: CreatePartnerInput) =>
    http
      .post<ApiResponse<{ partner: PartnerMember; emailSent: boolean }>>('/admin/partners', input)
      .then((r) => r.data.data),
};
