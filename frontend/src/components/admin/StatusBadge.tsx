import React from 'react';
import clsx from 'clsx';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral';

// Status text -> tone, covering bookings, payments, KYC, tickets, payouts, users.
const STATUS_TONES: Record<string, Tone> = {
  // success
  completed: 'success', paid: 'success', active: 'success', approved: 'success', verified: 'success',
  resolved: 'success', success: 'success', refunded: 'success', settled: 'success', published: 'success',
  // warning
  pending: 'warning', 'in review': 'warning', 'under review': 'warning', processing: 'warning',
  'on hold': 'warning', partial: 'warning', scheduled: 'warning', draft: 'warning', 'pending kyc': 'warning',
  // danger
  cancelled: 'danger', canceled: 'danger', failed: 'danger', rejected: 'danger', suspended: 'danger',
  blocked: 'danger', overdue: 'danger', expired: 'danger', disputed: 'danger', banned: 'danger',
  // info
  'in progress': 'info', 'en route': 'info', arrived: 'info', open: 'info', assigned: 'info', 'partner assigned': 'info',
  // brand
  confirmed: 'brand', new: 'brand',
};

export function toneForStatus(status: string): Tone {
  return STATUS_TONES[status.trim().toLowerCase()] ?? 'neutral';
}

interface StatusBadgeProps {
  status: string;
  /** Override the tone the status text would normally map to. */
  tone?: Tone;
  /** Show a leading dot. */
  dot?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, tone, dot = true, className }) => (
  <span className={clsx('hcx-badge', `hcx-badge--${tone ?? toneForStatus(status)}`, className)}>
    {dot && <span className="hcx-badge__dot" aria-hidden />}
    {status}
  </span>
);

export default StatusBadge;
