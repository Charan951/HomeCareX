import { auditService } from '../audit/audit.service';
import { ERROR_CODES } from '../../constants/errorCodes';
import { Errors } from '../../utils/errors';
import { AUDIT_ACTION, AUDIT_ENTITY } from './admin-customers.constants';
import type {
  AdminCustomerDetail,
  AdminCustomerRow,
  AdminCustomersPage,
  CustomerActivityItem,
  CustomerAddressItem,
  CustomerBookingItem,
  CustomerPaymentItem,
  CustomerReviewItem,
  CustomerStatus,
  CustomerStatusResult,
  CustomerTicketItem,
} from './admin-customers.types';
import { adminCustomersRepository, type CustomerAggRow } from './admin-customers.repository';
import type { DeleteCustomerBody, ListCustomersQuery, UpdateCustomerBody } from './admin-customers.validation';

const money = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function toRow(r: CustomerAggRow): AdminCustomerRow {
  return {
    id: String(r._id),
    name: r.name,
    email: r.email,
    phone: r.phone ?? null,
    status: r.status,
    bookingsCount: r.bookingsCount,
    ltv: money(r.ltv),
    lastActivityAt: r.lastActivityAt ?? null,
    createdAt: r.createdAt,
  };
}

/* ---------------- detail mappers (pure, so they can be tested without a database) ---------------- */

/** Loose shapes of the lean() documents; only the fields we read. */
type Lean = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const latest = (...dates: Array<Date | null | undefined>): Date | null => {
  const real = dates.filter((d): d is Date => d instanceof Date);
  return real.length ? new Date(Math.max(...real.map((d) => d.getTime()))) : null;
};

export const toBookingItem = (b: Lean): CustomerBookingItem => ({
  id: String(b._id),
  serviceName: b.serviceName,
  status: b.status,
  paymentStatus: b.paymentStatus,
  total: money(b.priceBreakdown?.total ?? 0),
  scheduledAt: b.scheduledAt ?? null,
  createdAt: b.createdAt,
});

export const toAddressItem = (a: Lean): CustomerAddressItem => ({
  id: String(a._id),
  label: a.label ?? 'Home',
  line1: a.line1,
  line2: a.line2 ?? null,
  landmark: a.landmark ?? null,
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  isDefault: Boolean(a.isDefault),
});

/** Razorpay ids and signatures are deliberately not part of the DTO. */
export const toPaymentItem = (p: Lean): CustomerPaymentItem => ({
  id: String(p._id),
  bookingId: String(p.bookingId),
  amount: money(p.amount ?? 0),
  currency: p.currency ?? 'INR',
  method: p.method ?? null,
  status: p.status,
  refundStatus: p.refund?.status ?? 'none',
  paidAt: p.paidAt ?? null,
  createdAt: p.createdAt,
});

export const toTicketItem = (t: Lean): CustomerTicketItem => ({
  id: String(t._id),
  subject: t.subject,
  category: t.category,
  status: t.status,
  priority: t.priority,
  lastMessageAt: t.lastMessageAt,
  createdAt: t.createdAt,
});

export const toReviewItem = (r: Lean): CustomerReviewItem => ({
  id: String(r._id),
  rating: r.rating,
  message: r.message,
  status: r.status,
  createdAt: r.createdAt,
});

/** `after.reason` is written by updateStatus below; older / foreign audit rows may not have one. */
export const toActivityItem = (a: Lean, adminNames: Map<string, string>): CustomerActivityItem => ({
  id: String(a._id),
  action: a.action,
  actor: adminNames.get(a.actor) ?? a.actor ?? null,
  reason: typeof a.after?.reason === 'string' ? a.after.reason : null,
  at: a.createdAt,
});

export const adminCustomersService = {
  async list(query: ListCustomersQuery): Promise<AdminCustomersPage> {
    const { rows, total } = await adminCustomersRepository.list(query);
    return {
      items: rows.map(toRow),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  },

  /** Everything the details page needs in one round trip. Each tab is capped (DETAIL_TAB_LIMIT); the overview has the true totals. */
  async getById(id: string): Promise<AdminCustomerDetail> {
    const user = await adminCustomersRepository.findCustomer(id);
    if (!user) throw Errors.notFound(ERROR_CODES.CUSTOMER_NOT_FOUND, 'Customer not found');

    const repo = adminCustomersRepository;
    const [stats, bookings, addresses, payments, tickets, openTickets, reviews, reviewsCount, trail] = await Promise.all([
      repo.bookingStats(id),
      repo.bookings(id),
      repo.addresses(id),
      repo.payments(id),
      repo.tickets(id),
      repo.openTicketCount(id),
      repo.reviews(id),
      repo.reviewCount(id),
      repo.auditTrail(id),
    ]);
    const names = await repo.adminNames([...new Set(trail.map((t) => String(t.actor)))]);
    const activity = trail.map((t) => toActivityItem(t, names));

    const status: CustomerStatus = user.status === 'blocked' ? 'blocked' : 'active';
    const lastChange = activity[0];
    const lastTrail = trail[0] as Lean | undefined;

    return {
      overview: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt ?? null,
        lastActivityAt: latest(user.lastLoginAt, stats.lastBookingAt),
        statusChange: lastChange
          ? {
              status: lastTrail?.after?.status === 'blocked' ? 'blocked' : 'active',
              reason: lastChange.reason,
              by: lastChange.actor,
              at: lastChange.at,
            }
          : null,
        stats: {
          bookingsCount: stats.bookingsCount,
          completedCount: stats.completedCount,
          cancelledCount: stats.cancelledCount,
          ltv: money(stats.ltv),
          openTickets,
          reviewsCount,
        },
      },
      bookings: bookings.map(toBookingItem),
      addresses: addresses.map(toAddressItem),
      payments: payments.map(toPaymentItem),
      activity,
      support: tickets.map(toTicketItem),
      reviews: reviews.map(toReviewItem),
    };
  },

  /**
   * Block / unblock. Order matters (and matches the task):
   *   1. status (+ session revoke on block, one atomic update)
   *   2. recordAudit with before/after + reason.
   * If the audit write fails the status change is NOT rolled back (a blocked customer must stay blocked);
   * the failure is logged loudly instead so it can be reconciled.
   */
  async updateStatus(
    id: string,
    input: { status: CustomerStatus; reason: string },
    actor: { id: string; ip: string },
  ): Promise<CustomerStatusResult> {
    const user = await adminCustomersRepository.findCustomer(id);
    if (!user) throw Errors.notFound(ERROR_CODES.CUSTOMER_NOT_FOUND, 'Customer not found');

    const previous: CustomerStatus = user.status === 'blocked' ? 'blocked' : 'active';
    if (previous === input.status) {
      throw Errors.conflict(ERROR_CODES.CONFLICT, `Customer is already ${input.status}`);
    }

    // Null means someone else changed the status between the read above and this write.
    const updated = await adminCustomersRepository.setStatus(id, previous, input.status);
    if (!updated) throw Errors.conflict(ERROR_CODES.CONFLICT, 'Customer status was changed by someone else. Reload and try again.');

    const blocked = input.status === 'blocked';
    try {
      await auditService.recordAudit({
        actor: actor.id,
        action: blocked ? AUDIT_ACTION.blocked : AUDIT_ACTION.unblocked,
        entity: AUDIT_ENTITY,
        entityId: id,
        before: { status: previous },
        after: { status: input.status, reason: input.reason, sessionsRevoked: blocked },
        ip: actor.ip,
        result: 'Success',
      });
    } catch (err) {
      console.error(`[admin-customers] audit write failed for customer ${id} (${previous} -> ${input.status}, by ${actor.id})`, err);
    }

    return { id, status: input.status, previousStatus: previous, sessionsRevoked: blocked };
  },

  /** Edit name / email / phone. Email and phone must stay unique across all users. */
  async updateProfile(id: string, input: UpdateCustomerBody, actor: { id: string; ip: string }) {
    const user = await adminCustomersRepository.findCustomer(id);
    if (!user) throw Errors.notFound(ERROR_CODES.CUSTOMER_NOT_FOUND, 'Customer not found');

    const taken = await adminCustomersRepository.contactTaken(id, input.email, input.phone);
    if (taken) {
      const what = taken.email === input.email ? 'email' : 'phone number';
      throw Errors.conflict(ERROR_CODES.CONFLICT, `Another account already uses this ${what}`);
    }

    const updated = await adminCustomersRepository.updateProfile(id, input);
    if (!updated) throw Errors.notFound(ERROR_CODES.CUSTOMER_NOT_FOUND, 'Customer not found');

    try {
      await auditService.recordAudit({
        actor: actor.id,
        action: AUDIT_ACTION.updated,
        entity: AUDIT_ENTITY,
        entityId: id,
        before: { name: user.name, email: user.email, phone: user.phone ?? null },
        after: { name: updated.name, email: updated.email, phone: updated.phone ?? null },
        ip: actor.ip,
        result: 'Success',
      });
    } catch (err) {
      console.error(`[admin-customers] audit write failed for customer ${id} (profile update, by ${actor.id})`, err);
    }

    return { id, name: updated.name, email: updated.email, phone: updated.phone ?? null };
  },

  /**
   * Permanently removes a customer. Customers with bookings are refused: deleting them would orphan booking,
   * payment and review history, so those should be blocked instead.
   */
  async remove(id: string, input: DeleteCustomerBody, actor: { id: string; ip: string }) {
    const user = await adminCustomersRepository.findCustomer(id);
    if (!user) throw Errors.notFound(ERROR_CODES.CUSTOMER_NOT_FOUND, 'Customer not found');

    if (await adminCustomersRepository.hasBookings(id)) {
      throw Errors.conflict(
        ERROR_CODES.CONFLICT,
        'This customer has bookings and cannot be removed. Block the customer instead to keep their history.',
      );
    }

    const deleted = await adminCustomersRepository.deleteCustomer(id);
    if (!deleted) throw Errors.notFound(ERROR_CODES.CUSTOMER_NOT_FOUND, 'Customer not found');

    try {
      await auditService.recordAudit({
        actor: actor.id,
        action: AUDIT_ACTION.deleted,
        entity: AUDIT_ENTITY,
        entityId: id,
        before: { name: user.name, email: user.email, phone: user.phone ?? null },
        after: { reason: input.reason },
        ip: actor.ip,
        result: 'Success',
      });
    } catch (err) {
      console.error(`[admin-customers] audit write failed for customer ${id} (delete, by ${actor.id})`, err);
    }

    return { id };
  },
};
