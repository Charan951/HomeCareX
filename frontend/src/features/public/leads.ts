import { useMutation } from '@tanstack/react-query';
import http from '@/lib/http';

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

/** NT-01 error mapping: 400 -> inline fields, 429 -> wait, 5xx / offline -> retry. */
export function leadErrorMessage(error: unknown): string {
  const status = (error as { status?: number } | null)?.status;
  if (status === undefined) return 'Unable to connect. Please check your internet connection and try again.';
  if (status === 400) return 'Please check the highlighted fields.';
  if (status === 429) return 'Too many submissions. Please wait a minute and try again.';
  if (status >= 500) return 'Something went wrong on our side. Please try again.';
  return (error as { message?: string }).message || 'Please check the highlighted fields.';
}

export const useCreateLead = () =>
  useMutation<PublicLeadResponse, Error, PublicLeadPayload>({
    mutationFn: async (payload) => {
      try {
        const response = await http.post<PublicLeadResponse>('/public/leads', payload);
        return response.data;
      } catch (error) {
        throw new Error(leadErrorMessage(error));
      }
    },
  });
