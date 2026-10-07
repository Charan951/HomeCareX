import type { PayoutItem, PayoutStatus } from '../../../types/payouts';

export const formatMoney = (n: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const formatDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: 'Pending',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
};

export const METHOD_LABEL: Record<string, string> = { bank_transfer: 'Bank transfer', upi: 'UPI' };
export const formatMethod = (m: string | null): string => (m ? METHOD_LABEL[m] ?? m : '—');

/** Which date to show for a payout, and what to call it. */
export const dateInfo = (p: PayoutItem): { label: string; value: string } => {
  if (p.status === 'paid' && p.paidAt) return { label: 'Paid on', value: formatDate(p.paidAt) };
  if (p.expectedDate) {
    return { label: p.status === 'failed' ? 'Scheduled' : 'Expected', value: formatDate(p.expectedDate) };
  }
  return { label: 'Requested', value: formatDate(p.createdAt) };
};