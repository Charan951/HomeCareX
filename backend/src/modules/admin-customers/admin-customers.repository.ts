import { Types, type PipelineStage } from 'mongoose';
import { AddressModel } from '../../models/Address';
import AuditLogModel from '../../models/AuditLog';
import { BookingModel } from '../../models/Booking';
import { PaymentModel } from '../../models/Payment';
import { ReviewModel } from '../../models/Review';
import { TicketModel } from '../../models/Ticket';
import { UserModel } from '../../models/User';
import {
  AUDIT_ENTITY,
  CANCELLED_STATUSES,
  COMPLETED_STATUSES,
  COMPUTED_SORT_FIELDS,
  DETAIL_TAB_LIMIT,
  LTV_PAYMENT_STATUS,
} from './admin-customers.constants';
import type { ListCustomersQuery } from './admin-customers.validation';

export interface CollectionNames {
  bookings: string;
}

/** Raw shape coming out of the aggregation, before the service tidies it up. */
export interface CustomerAggRow {
  _id: Types.ObjectId | string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'blocked';
  bookingsCount: number;
  ltv: number;
  lastActivityAt?: Date | null;
  createdAt: Date;
}

/** Case-insensitive ordering so "bharat" doesn't sort after "Zoya". */
export const COLLATION = { locale: 'en', strength: 2 } as const;

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Customers only; optional status + search (name, email or phone, case-insensitive substring). */
export function buildMatch(query: Pick<ListCustomersQuery, 'search' | 'status'>): Record<string, unknown> {
  const match: Record<string, unknown> = { role: 'customer' };

  // Older users may have no `status` field; the schema default makes them active.
  if (query.status === 'blocked') match.status = 'blocked';
  if (query.status === 'active') match.status = { $ne: 'blocked' };

  if (query.search) {
    const re = { $regex: escapeRegex(query.search), $options: 'i' };
    match.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  return match;
}

/** One $lookup per customer, grouped inside the lookup so only 1 small doc comes back (uses the customerId index). */
function statsStages(c: CollectionNames): PipelineStage[] {
  return [
    {
      $lookup: {
        from: c.bookings,
        let: { cid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$customerId', '$$cid'] } } },
          {
            $group: {
              _id: null,
              bookingsCount: { $sum: 1 },
              ltv: {
                $sum: {
                  $cond: [{ $eq: ['$paymentStatus', LTV_PAYMENT_STATUS] }, { $ifNull: ['$priceBreakdown.total', 0] }, 0],
                },
              },
              lastBookingAt: { $max: '$createdAt' },
            },
          },
        ],
        as: '_stats',
      },
    },
    { $addFields: { _stats: { $arrayElemAt: ['$_stats', 0] } } },
    {
      $addFields: {
        bookingsCount: { $ifNull: ['$_stats.bookingsCount', 0] },
        ltv: { $ifNull: ['$_stats.ltv', 0] },
        // $max over an array ignores null/missing, so this is whichever of the two exists (or null).
        lastActivityAt: { $max: ['$lastLoginAt', '$_stats.lastBookingAt'] },
      },
    },
  ];
}

const PROJECT: PipelineStage = {
  // Explicit projection: aggregation ignores `select: false`, so this is what keeps passwordHash out of the response.
  $project: {
    name: 1,
    email: 1,
    phone: 1,
    status: 1,
    bookingsCount: 1,
    ltv: 1,
    lastActivityAt: 1,
    createdAt: 1,
  },
};

/**
 * Sorting by a User field: sort + paginate first, then $lookup only the rows on the page.
 * Sorting by bookingsCount / ltv / lastActivityAt: every matched customer needs its stats before sorting.
 */
export function buildItemsPipeline(query: ListCustomersQuery, collections: CollectionNames): PipelineStage[] {
  const dir = query.sortDir === 'asc' ? 1 : -1;
  const sort: PipelineStage = { $sort: { [query.sortBy]: dir, _id: dir } }; // _id keeps page order stable on ties
  const paging: PipelineStage[] = [{ $skip: (query.page - 1) * query.limit }, { $limit: query.limit }];

  const head: PipelineStage[] = [
    { $match: buildMatch(query) },
    { $addFields: { status: { $ifNull: ['$status', 'active'] } } },
  ];

  const computed = COMPUTED_SORT_FIELDS.includes(query.sortBy);
  return computed
    ? [...head, ...statsStages(collections), sort, ...paging, PROJECT]
    : [...head, sort, ...paging, ...statsStages(collections), PROJECT];
}

export const adminCustomersRepository = {
  async list(query: ListCustomersQuery): Promise<{ rows: CustomerAggRow[]; total: number }> {
    const collections: CollectionNames = { bookings: BookingModel.collection.name };
    const [rows, total] = await Promise.all([
      UserModel.aggregate<CustomerAggRow>(buildItemsPipeline(query, collections)).collation(COLLATION),
      UserModel.countDocuments(buildMatch(query)),
    ]);
    return { rows, total };
  },

  /** The customer's own User document (passwordHash is `select: false`), or null for a missing id / a non-customer. */
  findCustomer(id: string) {
    return UserModel.findOne({ _id: id, role: 'customer' }).lean();
  },

  /** Booking totals for the overview. One pass over the customer's bookings (uses the customerId index). */
  async bookingStats(customerId: string) {
    const [row] = await BookingModel.aggregate<{
      bookingsCount: number;
      completedCount: number;
      cancelledCount: number;
      ltv: number;
      lastBookingAt: Date | null;
    }>([
      { $match: { customerId: new Types.ObjectId(customerId) } },
      {
        $group: {
          _id: null,
          bookingsCount: { $sum: 1 },
          completedCount: { $sum: { $cond: [{ $in: ['$status', COMPLETED_STATUSES] }, 1, 0] } },
          cancelledCount: { $sum: { $cond: [{ $in: ['$status', CANCELLED_STATUSES] }, 1, 0] } },
          ltv: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', LTV_PAYMENT_STATUS] }, { $ifNull: ['$priceBreakdown.total', 0] }, 0] },
          },
          lastBookingAt: { $max: '$createdAt' },
        },
      },
    ]);
    return row ?? { bookingsCount: 0, completedCount: 0, cancelledCount: 0, ltv: 0, lastBookingAt: null };
  },

  bookings: (customerId: string) =>
    BookingModel.find({ customerId })
      .select('serviceName status paymentStatus priceBreakdown.total scheduledAt createdAt')
      .sort({ createdAt: -1 })
      .limit(DETAIL_TAB_LIMIT)
      .lean(),

  addresses: (customerId: string) =>
    AddressModel.find({ customerId }).sort({ isDefault: -1, createdAt: -1 }).limit(DETAIL_TAB_LIMIT).lean(),

  payments: (customerId: string) =>
    PaymentModel.find({ customerId }).sort({ createdAt: -1 }).limit(DETAIL_TAB_LIMIT).lean(),

  tickets: (customerId: string) =>
    TicketModel.find({ createdBy: customerId }).sort({ lastMessageAt: -1 }).limit(DETAIL_TAB_LIMIT).lean(),

  openTicketCount: (customerId: string) =>
    TicketModel.countDocuments({ createdBy: customerId, status: { $in: ['open', 'in_progress'] } }),

  reviews: (customerId: string) =>
    ReviewModel.find({ customerId }).sort({ createdAt: -1 }).limit(DETAIL_TAB_LIMIT).lean(),

  reviewCount: (customerId: string) => ReviewModel.countDocuments({ customerId }),

  /** Audit trail for this customer (block / unblock). AuditLog.actor is the admin's user id as a string. */
  auditTrail: (customerId: string) =>
    AuditLogModel.find({ entity: AUDIT_ENTITY, entityId: customerId }).sort({ createdAt: -1 }).limit(DETAIL_TAB_LIMIT).lean(),

  /** id -> name for the admins that appear in the audit trail. Ignores actors that are not valid ObjectIds. */
  async adminNames(ids: string[]): Promise<Map<string, string>> {
    const valid = ids.filter((id) => Types.ObjectId.isValid(id));
    if (valid.length === 0) return new Map();
    const users = await UserModel.find({ _id: { $in: valid } }).select('name').lean();
    return new Map(users.map((u) => [String(u._id), u.name]));
  },

  /** Another user (any role) already using this email or phone. */
  async contactTaken(id: string, email: string, phone?: string) {
    const or: Record<string, unknown>[] = [{ email }];
    if (phone) or.push({ phone });
    return UserModel.findOne({ _id: { $ne: id }, $or: or }).select('email phone').lean();
  },

  updateProfile(id: string, input: { name: string; email: string; phone?: string }) {
    const update = input.phone
      ? { $set: { name: input.name, email: input.email, phone: input.phone } }
      : { $set: { name: input.name, email: input.email }, $unset: { phone: 1 } };
    return UserModel.findOneAndUpdate({ _id: id, role: 'customer' }, update, { new: true }).lean();
  },

  hasBookings: async (customerId: string) => (await BookingModel.exists({ customerId })) !== null,

  /** Deletes the customer and their saved addresses. */
  async deleteCustomer(id: string) {
    const res = await UserModel.deleteOne({ _id: id, role: 'customer' });
    if (res.deletedCount) await AddressModel.deleteMany({ customerId: id });
    return res.deletedCount > 0;
  },

  /**
   * Sets the status in one atomic update. Blocking also bumps tokenVersion, which makes every refresh token
   * issued before now fail in authService.refresh (it compares payload.v with the stored tokenVersion), so the
   * status change and the session revoke can never be half-applied.
   * The `status` filter makes a double-click / two admins at once a no-op for the second request (returns null).
   * Legacy users with no status field count as 'active'.
   */
  setStatus(id: string, from: 'active' | 'blocked', to: 'active' | 'blocked') {
    const fromFilter = from === 'blocked' ? { status: 'blocked' } : { status: { $ne: 'blocked' } };
    return UserModel.findOneAndUpdate(
      { _id: id, role: 'customer', ...fromFilter },
      to === 'blocked' ? { $set: { status: 'blocked' }, $inc: { tokenVersion: 1 } } : { $set: { status: 'active' } },
      { new: true },
    ).lean();
  },
};
