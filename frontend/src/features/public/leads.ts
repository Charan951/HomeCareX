import { useMutation } from '@tanstack/react-query';
import http from '@/lib/http'; // 👈 Fixed import

export type LeadSource = 'contact' | 'partner';
export type LeadStatus = 'new' | 'contacted' | 'closed';

export type ContactLeadPayload = {
  name: string;
  email: string;
  phone: string;
  city: string;
  message: string;
  source: 'contact';
};

export type PartnerLeadPayload = {
  name: string;
  phone: string;
  city: string;
  skills: string;
  source: 'partner';
};

export type PublicLeadPayload = ContactLeadPayload | PartnerLeadPayload;

export type PublicLeadResponse = {
  success: boolean;
  message: string;
};

export const useCreateLead = () =>
  useMutation<PublicLeadResponse, Error, PublicLeadPayload>({
    mutationFn: async (payload) => {
      // 👈 Fixed API call to use 'http' instead of 'apiClient'
      const response = await http.post<PublicLeadResponse>('/public/leads', payload);
      return response.data;
    },
  });