import type { Request, Response } from 'express';

import { BookingModel } from '../../models/Booking';
import { PartnerModel } from '../../models/Partner';
import { getAuthUser } from '../../middleware/auth.middleware';
import { HttpError } from '../auth/auth.types';
import {
  BOOKING_STATUSES,
  type BookingStatus,
} from '../bookings/bookings.constants';

export class AdminBookingsController {
  async getBookings(req: Request, res: Response): Promise<void> {
    const user = getAuthUser(req);

    if (user.role !== 'admin') {
      throw new HttpError(
        403,
        'You do not have access to this resource',
        'FORBIDDEN',
      );
    }

    const {
      search,
      status,
      city,
      category,
      customer,
      partner,
      date,
    } = req.query as Record<string, string | undefined>;

    const query: Record<string, unknown> = {};

    if (status) {
      query.status = status;
    }

    if (city) {
      query['address.city'] = {
        $regex: city,
        $options: 'i',
      };
    }

    if (category) {
      query.categoryId = category;
    }

    if (customer) {
      query.customerName = {
        $regex: customer,
        $options: 'i',
      };
    }

    if (partner) {
      query.partnerId = partner;
    }

    if (date) {
      const start = new Date(`${date}T00:00:00.000Z`);
      const end = new Date(`${date}T23:59:59.999Z`);

      query.scheduledAt = {
        $gte: start,
        $lte: end,
      };
    }

    if (search) {
      query.$or = [
        {
          customerName: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          serviceName: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const bookings = await BookingModel.find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const data = bookings.map((booking) => {
      const bookingId = booking._id.toString();

      const scheduledAt = booking.scheduledAt
        ? booking.scheduledAt.toISOString()
        : '';

      const createdAt = booking.createdAt
        ? booking.createdAt.toISOString()
        : '';

      const address = booking.address;

      return {
        id: bookingId,

        customer: {
          id: booking.customerId.toString(),
          name: booking.customerName,
          phone: '',
          email: '',
        },

        service: {
          id: booking.categoryId.toString(),
          name: booking.serviceName,
          category: 'Home Services',
          durationMinutes: 60,
        },

        partner: booking.partnerId
          ? {
              id: booking.partnerId.toString(),
              name: 'Assigned Partner',
              category: 'Home Services',
            }
          : null,

        city: address?.city ?? '',

        address: {
          line1: address?.line1 ?? '',
          area: address?.area ?? '',
          city: address?.city ?? '',
          pincode: address?.pincode ?? '',
        },

        slot: {
          date: scheduledAt,
          startTime: scheduledAt,
          endTime: scheduledAt,
        },

        pricing: {
          baseAmount: booking.priceBreakdown?.base ?? 0,
          addOnAmount: booking.priceBreakdown?.addOns ?? 0,
          discountAmount: booking.priceBreakdown?.discount ?? 0,
          convenienceFee:
            booking.priceBreakdown?.convenienceFee ?? 0,
          taxAmount: booking.priceBreakdown?.tax ?? 0,
          totalAmount: booking.priceBreakdown?.total ?? 0,
        },

        status: booking.status,

        payment: {
          status: 'Pending',
        },

        createdAt,

        timeline: (booking.statusHistory ?? []).map(
          (item, index) => ({
            id: `${bookingId}-${index}`,
            title: item.to,
            description: item.reason ?? '',
            timestamp: item.at
              ? item.at.toISOString()
              : '',
            actor: {
              type: item.actorRole,
              name: item.actorId ?? item.actorRole,
            },
          }),
        ),
      };
    });

    res.status(200).json({
      success: true,
      data,
    });
  }

  async getBookingById(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);

    if (user.role !== 'admin') {
      throw new HttpError(
        403,
        'You do not have access to this resource',
        'FORBIDDEN',
      );
    }

    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId)
      .lean()
      .exec();

    if (!booking) {
      throw new HttpError(
        404,
        'Booking not found',
        'BOOKING_NOT_FOUND',
      );
    }

    const bookingIdString = booking._id.toString();

    const scheduledAt = booking.scheduledAt
      ? booking.scheduledAt.toISOString()
      : '';

    const createdAt = booking.createdAt
      ? booking.createdAt.toISOString()
      : '';

    const address = booking.address;

    const data = {
      id: bookingIdString,

      customer: {
        id: booking.customerId.toString(),
        name: booking.customerName,
        phone: '',
        email: '',
      },

      service: {
        id: booking.categoryId.toString(),
        name: booking.serviceName,
        category: 'Home Services',
        durationMinutes: 60,
      },

      partner: booking.partnerId
        ? {
            id: booking.partnerId.toString(),
            name: 'Assigned Partner',
            category: 'Home Services',
          }
        : null,

      city: address?.city ?? '',

      address: {
        line1: address?.line1 ?? '',
        area: address?.area ?? '',
        city: address?.city ?? '',
        pincode: address?.pincode ?? '',
      },

      slot: {
        date: scheduledAt,
        startTime: scheduledAt,
        endTime: scheduledAt,
      },

      pricing: {
        baseAmount: booking.priceBreakdown?.base ?? 0,
        addOnAmount: booking.priceBreakdown?.addOns ?? 0,
        discountAmount: booking.priceBreakdown?.discount ?? 0,
        convenienceFee:
          booking.priceBreakdown?.convenienceFee ?? 0,
        taxAmount: booking.priceBreakdown?.tax ?? 0,
        totalAmount: booking.priceBreakdown?.total ?? 0,
      },

      status: booking.status,

      payment: {
        status: 'Pending',
      },

      createdAt,

      timeline: (booking.statusHistory ?? []).map(
        (item, index) => ({
          id: `${bookingIdString}-${index}`,
          title: item.to,
          description: item.reason ?? '',
          timestamp: item.at
            ? item.at.toISOString()
            : '',
          actor: {
            type: item.actorRole,
            name: item.actorId ?? item.actorRole,
          },
        }),
      ),
    };

    res.status(200).json({
      success: true,
      data,
    });
  }

  async getEligiblePartners(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);

    if (user.role !== 'admin') {
      throw new HttpError(
        403,
        'You do not have access to this resource',
        'FORBIDDEN',
      );
    }

    const { bookingId } = req.params;

    const booking = await BookingModel.findById(bookingId)
      .lean()
      .exec();

    if (!booking) {
      throw new HttpError(
        404,
        'Booking not found',
        'BOOKING_NOT_FOUND',
      );
    }

    const partners = await PartnerModel.find({
      status: 'active',
      'kyc.status': 'approved',
      trainingCompleted: true,
      categories: booking.categoryId,
    })
      .sort({
        ratingAvg: -1,
        ratingCount: -1,
      })
      .lean()
      .exec();

    const data = partners.map((partner) => ({
      id: partner._id.toString(),
      name: partner.userId.toString(),
      category: 'Home Services',
      rating: partner.ratingAvg ?? 0,
      distanceKm: null,
      availability: 'Available',
    }));

    res.status(200).json({
      success: true,
      data,
    });
  }

  async assignPartner(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);

    if (user.role !== 'admin') {
      throw new HttpError(
        403,
        'You do not have access to this resource',
        'FORBIDDEN',
      );
    }

    const { bookingId } = req.params;

    const { partnerId } = req.body as {
      partnerId?: string;
    };

    if (!partnerId) {
      throw new HttpError(
        400,
        'partnerId is required',
        'PARTNER_ID_REQUIRED',
      );
    }

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      throw new HttpError(
        404,
        'Booking not found',
        'BOOKING_NOT_FOUND',
      );
    }

    const partner = await PartnerModel.findById(partnerId);

    if (!partner) {
      throw new HttpError(
        404,
        'Partner not found',
        'PARTNER_NOT_FOUND',
      );
    }

    if (partner.status !== 'active') {
      throw new HttpError(
        400,
        'Partner is not active',
        'PARTNER_NOT_ACTIVE',
      );
    }

    if (partner.kyc?.status !== 'approved') {
      throw new HttpError(
        400,
        'Partner KYC is not approved',
        'PARTNER_KYC_NOT_APPROVED',
      );
    }

    if (!partner.trainingCompleted) {
      throw new HttpError(
        400,
        'Partner training is not completed',
        'PARTNER_TRAINING_INCOMPLETE',
      );
    }

    const hasCategory = partner.categories.some(
      (categoryId) =>
        categoryId.toString() ===
        booking.categoryId.toString(),
    );

    if (!hasCategory) {
      throw new HttpError(
        400,
        'Partner is not eligible for this booking category',
        'PARTNER_CATEGORY_MISMATCH',
      );
    }

    const previousStatus = booking.status;

    booking.partnerId = partner._id;
    booking.status = 'assigned';

    booking.statusHistory.push({
      from: previousStatus,
      to: 'assigned',
      reason: 'Partner assigned by admin',
      actorId: user.id,
      actorRole: 'admin',
      at: new Date(),
    });

    await booking.save();

    const scheduledAt = booking.scheduledAt
      ? booking.scheduledAt.toISOString()
      : '';

    const createdAt = booking.createdAt
      ? booking.createdAt.toISOString()
      : '';

    const address = booking.address;

    const data = {
      id: booking._id.toString(),

      customer: {
        id: booking.customerId.toString(),
        name: booking.customerName,
        phone: '',
        email: '',
      },

      service: {
        id: booking.categoryId.toString(),
        name: booking.serviceName,
        category: 'Home Services',
        durationMinutes: 60,
      },

      partner: {
        id: partner._id.toString(),
        name: partner.userId.toString(),
        category: 'Home Services',
      },

      city: address?.city ?? '',

      address: {
        line1: address?.line1 ?? '',
        area: address?.area ?? '',
        city: address?.city ?? '',
        pincode: address?.pincode ?? '',
      },

      slot: {
        date: scheduledAt,
        startTime: scheduledAt,
        endTime: scheduledAt,
      },

      pricing: {
        baseAmount: booking.priceBreakdown?.base ?? 0,
        addOnAmount: booking.priceBreakdown?.addOns ?? 0,
        discountAmount: booking.priceBreakdown?.discount ?? 0,
        convenienceFee:
          booking.priceBreakdown?.convenienceFee ?? 0,
        taxAmount: booking.priceBreakdown?.tax ?? 0,
        totalAmount: booking.priceBreakdown?.total ?? 0,
      },

      status: booking.status,

      payment: {
        status: 'Pending',
      },

      createdAt,

      timeline: (booking.statusHistory ?? []).map(
        (item, index) => ({
          id: `${booking._id.toString()}-${index}`,
          title: item.to,
          description: item.reason ?? '',
          timestamp: item.at
            ? item.at.toISOString()
            : '',
          actor: {
            type: item.actorRole,
            name: item.actorId ?? item.actorRole,
          },
        }),
      ),
    };

    res.status(200).json({
      success: true,
      data,
    });
  }

  async overrideStatus(
    req: Request,
    res: Response,
  ): Promise<void> {
    const user = getAuthUser(req);

    if (user.role !== 'admin') {
      throw new HttpError(
        403,
        'You do not have access to this resource',
        'FORBIDDEN',
      );
    }

    const { bookingId } = req.params;

    const { status, reason } = req.body as {
      status?: string;
      reason?: string;
    };

    if (!status) {
      throw new HttpError(
        400,
        'Status is required',
        'STATUS_REQUIRED',
      );
    }

    if (!reason || !reason.trim()) {
      throw new HttpError(
        400,
        'Override reason is required',
        'OVERRIDE_REASON_REQUIRED',
      );
    }

    const isValidStatus = (
      value: string,
    ): value is BookingStatus =>
      (BOOKING_STATUSES as readonly string[]).includes(value);

    if (!isValidStatus(status)) {
      throw new HttpError(
        400,
        `Invalid booking status: ${status}`,
        'INVALID_BOOKING_STATUS',
      );
    }

    const booking = await BookingModel.findById(bookingId);

    if (!booking) {
      throw new HttpError(
        404,
        'Booking not found',
        'BOOKING_NOT_FOUND',
      );
    }

    const previousStatus = booking.status;
    const newStatus: BookingStatus = status;

    booking.status = newStatus;

    booking.statusHistory.push({
      from: previousStatus,
      to: newStatus,
      reason: reason.trim(),
      actorId: user.id,
      actorRole: 'admin',
      at: new Date(),
    });

    await booking.save();

    res.status(200).json({
      success: true,
      data: {
        id: booking._id.toString(),
        status: booking.status,
        previousStatus,
        reason: reason.trim(),
      },
    });
  }
}

export const adminBookingsController =
  new AdminBookingsController();