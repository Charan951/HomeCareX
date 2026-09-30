import { Types } from 'mongoose';
import { ERROR_CODES } from '../../constants/errorcodes';
import { dayBounds } from '../../utils/dates';
import { Errors } from '../../utils/errors';
import type { ActiveJobDto, PartnerDashboardDto } from './partner-dashboard.types';
import { partnerDashboardRepository as repo } from './partner-dashboard.repository';

const percent = (part: number, whole: number): number => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);
const money = (n: number): number => Math.round(n * 100) / 100;

export const partnerDashboardService = {
  /**
   * @param userId  from the verified JWT (never from the client)
   * @param requestedPartnerId optional client-supplied id; rejected unless it is the caller's own
   */
  async getDashboard(userId: string, requestedPartnerId?: string, now: Date = new Date()): Promise<PartnerDashboardDto> {
    const partner = await repo.findPartnerByUserId(userId);
    if (!partner) throw Errors.notFound(ERROR_CODES.PARTNER_NOT_FOUND, 'No partner profile found for this account');

    const partnerId = partner._id as Types.ObjectId;
    if (requestedPartnerId && requestedPartnerId !== partnerId.toString()) throw Errors.notOwner();

    const { start, end } = dayBounds(now);
    const [newJobs, todayJobs, completed, activeDoc] = await Promise.all([
      repo.countOpenOffers(partnerId, now),
      repo.countScheduled(partnerId, start, end),
      repo.completedToday(partnerId, start, end),
      repo.findActiveJob(partnerId),
    ]);

    const activeJob: ActiveJobDto | null = activeDoc
      ? {
          id: activeDoc._id.toString(),
          service: activeDoc.serviceName,
          customer: activeDoc.customerName,
          address: [activeDoc.address.area, activeDoc.address.city].filter(Boolean).join(', '),
          status: activeDoc.status,
          scheduledAt: activeDoc.scheduledAt.toISOString(),
        }
      : null;

    return {
      newJobs,
      todayJobs,
      completedJobs: completed.count,
      todayEarnings: money(completed.earnings),
      rating: partner.ratingAvg ?? 0,
      acceptanceRate: percent(partner.stats?.offersAccepted ?? 0, partner.stats?.offersReceived ?? 0),
      completionRate: percent(partner.stats?.jobsCompleted ?? 0, partner.stats?.jobsAssigned ?? 0),
      activeJob,
    };
  },
};