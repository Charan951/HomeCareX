import type { ApiJob, JobDetails } from './jobDetails.types';

const ACTOR_LABEL: Record<string, string> = {
  partner: 'Partner',
  customer: 'Customer',
  admin: 'Admin',
  system: 'System',
};

/** Short, readable code from the Mongo id, e.g. "#A1B2C3". */
export const bookingCode = (id: string): string => `#${id.slice(-6).toUpperCase()}`;

/** Pure: no network, no React. Turns the API response into what the page renders. */
export function mapJob(api: ApiJob): JobDetails {
  return {
    id: api.id,
    bookingCode: bookingCode(api.id),
    status: api.status,
    customer: { name: api.customer.name, phoneMasked: api.customer.phone ?? '—' },
    service: api.service,
    location: {
      address: [api.location.line1, api.location.area].filter(Boolean).join(', '),
      city: api.location.city,
      pincode: api.location.pincode,
    },
    schedule: { scheduledAt: api.schedule.scheduledAt, slot: api.schedule.slot },
    price: { total: api.price.total, partnerEarning: api.price.partnerEarning },
    addOns: api.addOns.map((a, i) => ({ id: `${a.name}-${i}`, ...a })),
    instructions: api.instructions,
    checklist: api.checklist,
    payment: { status: api.payment.status, amount: api.price.total },
    actions: api.actions,
    otpRequired: api.otpRequired,
    history: api.statusHistory.map((h) => ({
      status: h.to,
      at: h.at,
      actor: ACTOR_LABEL[h.actorRole] ?? h.actorRole,
    })),
  };
}