import { useMutation } from '@tanstack/react-query';

import { apiClient } from '@/services/apiClient';

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
      const response = await apiClient.post<PublicLeadResponse>('/public/leads', payload);
      return response.data;
    },
  });
