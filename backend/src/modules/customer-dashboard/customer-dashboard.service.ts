import { Types } from 'mongoose';
import { Errors } from '../../utils/errors';
import type { AddressDto } from '../addresses/addresses.types';
import { LIVE_PROGRESS_STEP } from './customer-dashboard.constants';
import { customerDashboardRepository as repo } from './customer-dashboard.repository';
import type {
  AddressRow,
  BookingRow,
  CategoryRow,
  CustomerDashboardDto,
  DashboardBookingDto,
  DashboardCategoryDto,
  DashboardServiceDto,
  ServiceRow,
} from './customer-dashboard.types';
import { ERROR_CODES } from '../../constants/ErrorCodes';

/* ---------- pure mappers (unit-tested) ---------- */

export const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? '';

/** "Ramesh Kumar" → "Ramesh K."; the customer never sees a partner's full name. */
export function shortPartnerName(name?: string | null): string | null {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export const progressStep = (status: BookingRow['status']): number => LIVE_PROGRESS_STEP[status] ?? 0;

export function toBookingDto(row: BookingRow): DashboardBookingDto {
  return {
    id: row._id.toString(),
    serviceName: row.serviceName,
    status: row.status,
    scheduledAt: row.scheduledAt.toISOString(),
    partnerName: shortPartnerName(row.partnerName),
    progressStep: progressStep(row.status),
    address: { line1: row.address.line1, area: row.address.area ?? null, city: row.address.city },
    total: row.priceBreakdown?.total ?? 0,
  };
}

export const toCategoryDto = (row: CategoryRow): DashboardCategoryDto => ({
  id: row._id.toString(),
  name: row.name,
  slug: row.slug,
  icon: row.icon ?? null,
  serviceCount: row.serviceCount,
});

export const toServiceDto = (row: ServiceRow): DashboardServiceDto => ({
  id: row._id.toString(),
  name: row.name,
  slug: row.slug,
  categoryId: row.categoryId.toString(),
  icon: row.icon ?? null,
  price: row.basePrice,
  durationMinutes: row.durationMinutes,
  rating: row.ratingAvg ?? 0,
  ratingCount: row.ratingCount ?? 0,
});

export const toAddressDto = (row: AddressRow): AddressDto => ({
  id: row._id.toString(),
  label: row.label,
  line1: row.line1,
  area: row.area ?? null,
  city: row.city,
  pincode: row.pincode ?? null,
  isDefault: row.isDefault ?? false,
});

/* ---------- service ---------- */

export const customerDashboardService = {
  /**
   * @param userId  from the verified token (req.user.id) — the ONLY identity used in queries
   * @param requestedCustomerId optional client-supplied id; rejected with 403 unless it is the caller's own
   */
  async getDashboard(userId: string, requestedCustomerId?: string): Promise<CustomerDashboardDto> {
    if (!Types.ObjectId.isValid(userId)) throw Errors.unauthorized();
    if (requestedCustomerId && requestedCustomerId !== userId) throw Errors.notOwner();

    const customerId = new Types.ObjectId(userId);
    const customer = await repo.findCustomerName(customerId);
    if (!customer) throw Errors.notFound(ERROR_CODES.NOT_FOUND, 'Customer not found');

    const [bookings, address, categories, services, unread] = await Promise.all([
      repo.bookings(customerId),
      repo.defaultAddress(customerId),
      repo.categories(),
      repo.recommendedServices(),
      repo.unreadNotifications(customerId),
    ]);

    return {
      greeting: { name: customer.name, firstName: firstName(customer.name) },
      isNewCustomer: bookings.total === 0,
      defaultAddress: address ? toAddressDto(address) : null,
      activeBookings: bookings.active.map(toBookingDto),
      upcomingBookings: bookings.upcoming.map(toBookingDto),
      categories: categories.map(toCategoryDto),
      recommendedServices: services.map(toServiceDto),
      unreadNotifications: unread,
    };
  },
};
