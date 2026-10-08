import { Types } from 'mongoose';

import { BookingModel } from '../../models/Booking';
import { PaymentModel } from '../../models/Payment';
import {
  RefundModel,
  type RefundMethod,
  type RefundRequestStatus,
} from '../../models/Refund';
import { getRazorpay } from '../../integrations/razorpay';
import { AppError } from '../../utils/AppError';
import { notify } from '../notifications';
import { auditService } from '../audit/audit.service';

export interface CreateRefundServiceInput {
  paymentId: string;
  amount: number;
  reason: string;
  method?: RefundMethod;
  adminId: string;
  ip: string;
}

export interface UpdateRefundServiceInput {
  refundId: string;
  action: 'approve' | 'reject';
  rejectionReason?: string;
  adminId: string;
  ip: string;
}

function isObjectId(value: string): boolean {
  return Types.ObjectId.isValid(value);
}

function toPaise(amountInr: number): number {
  return Math.round(amountInr * 100);
}

/**
 * Returns the total amount already refunded successfully
 * for the payment.
 *
 * Only processed refunds are counted as actually refunded.
 */
async function getRefundedAmount(
  paymentId: Types.ObjectId,
): Promise<number> {
  const refunds = await RefundModel.find({
    paymentId,
    status: 'processed',
  })
    .select('amount')
    .lean();

  if (refunds.length > 0) {
    return refunds.reduce(
      (total, refund) => total + refund.amount,
      0,
    );
  }

  const payment = await PaymentModel.findById(paymentId)
    .select('refund')
    .lean();

  return payment?.refund?.amount ?? 0;
}

/**
 * Returns amounts currently reserved by refund requests
 * that have not yet been completed or rejected.
 */
async function getReservedRefundAmount(
  paymentId: Types.ObjectId,
): Promise<number> {
  const refunds = await RefundModel.find({
    paymentId,
    status: {
      $in: ['requested', 'approved'],
    },
  })
    .select('amount')
    .lean();

  return refunds.reduce(
    (total, refund) => total + refund.amount,
    0,
  );
}

export class RefundsService {
  /**
   * Create a new refund request.
   *
   * POST /admin/refunds
   */
  async createRefund(input: CreateRefundServiceInput) {
    const {
      paymentId,
      amount,
      reason,
      method = 'RAZORPAY',
      adminId,
      ip,
    } = input;

    // -----------------------------------------
    // Validate payment ID
    // -----------------------------------------
    if (!isObjectId(paymentId)) {
      throw new AppError(
        400,
        'INVALID_PAYMENT_ID',
        'Invalid payment ID',
      );
    }

    // -----------------------------------------
    // Validate amount
    // -----------------------------------------
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new AppError(
        400,
        'INVALID_REFUND_AMOUNT',
        'Refund amount must be greater than zero',
      );
    }

    // -----------------------------------------
    // Validate reason
    // -----------------------------------------
    if (!reason.trim()) {
      throw new AppError(
        400,
        'REFUND_REASON_REQUIRED',
        'Refund reason is required',
      );
    }

    // -----------------------------------------
    // Validate refund method
    // -----------------------------------------
    if (method !== 'RAZORPAY') {
      throw new AppError(
        400,
        'UNSUPPORTED_REFUND_METHOD',
        'Only Razorpay refunds are currently supported',
      );
    }

    // -----------------------------------------
    // Validate admin ID
    // -----------------------------------------
    if (!isObjectId(adminId)) {
      throw new AppError(
        400,
        'INVALID_ADMIN_ID',
        'Invalid admin ID',
      );
    }

    // -----------------------------------------
    // Find payment
    // -----------------------------------------
    const payment = await PaymentModel.findById(paymentId);

    if (!payment) {
      throw new AppError(
        404,
        'PAYMENT_NOT_FOUND',
        'Payment record not found',
      );
    }

    // -----------------------------------------
    // Validate payment status
    // -----------------------------------------
    if (
      payment.status !== 'PAID' &&
      payment.status !== 'REFUNDED'
    ) {
      throw new AppError(
        400,
        'PAYMENT_NOT_REFUNDABLE',
        'Only a paid payment can be refunded',
      );
    }

    // -----------------------------------------
    // Razorpay payment ID required
    // -----------------------------------------
    if (!payment.razorpayPaymentId) {
      throw new AppError(
        400,
        'RAZORPAY_PAYMENT_ID_MISSING',
        'Paid payment does not contain a Razorpay payment ID',
      );
    }

    // -----------------------------------------
    // Currency validation
    // -----------------------------------------
    if (payment.currency.toUpperCase() !== 'INR') {
      throw new AppError(
        400,
        'UNSUPPORTED_CURRENCY',
        'Only INR refunds are currently supported',
      );
    }

    // -----------------------------------------
    // Find booking
    // -----------------------------------------
    const booking = await BookingModel.findById(
      payment.bookingId,
    );

    if (!booking) {
      throw new AppError(
        404,
        'BOOKING_NOT_FOUND',
        'Booking associated with payment was not found',
      );
    }

    // -----------------------------------------
    // Find customer
    // -----------------------------------------
    const customerId =
      payment.customerId ?? booking.customerId;

    if (!customerId) {
      throw new AppError(
        400,
        'CUSTOMER_NOT_FOUND',
        'Customer associated with payment was not found',
      );
    }

    // -----------------------------------------
    // Calculate refundable amount
    // -----------------------------------------
    const paidAmount = payment.amount;

    const alreadyRefunded =
      await getRefundedAmount(payment._id);

    const reservedAmount =
      await getReservedRefundAmount(payment._id);

    const remainingAmount =
      paidAmount -
      alreadyRefunded -
      reservedAmount;

    // -----------------------------------------
    // Refund cannot exceed remaining amount
    // -----------------------------------------
    if (amount > remainingAmount) {
      throw new AppError(
        400,
        'REFUND_EXCEEDS_PAID_AMOUNT',
        `Refund amount cannot exceed the remaining refundable amount of ₹${Math.max(
          remainingAmount,
          0,
        ).toFixed(2)}`,
        {
          paidAmount,
          alreadyRefunded,
          reservedAmount,
          remainingAmount: Math.max(
            remainingAmount,
            0,
          ),
        },
      );
    }

    // -----------------------------------------
    // Create refund request
    // -----------------------------------------
    const refund = await RefundModel.create({
      paymentId: payment._id,
      bookingId: payment.bookingId,
      customerId,
      amount,
      currency: payment.currency,
      reason: reason.trim(),
      method,
      status: 'requested',
      requestedBy: new Types.ObjectId(adminId),
      requestedAt: new Date(),
    });

    // -----------------------------------------
    // Update payment refund information
    // -----------------------------------------
    await PaymentModel.updateOne(
      { _id: payment._id },
      {
        $set: {
          'refund.status': 'requested',
          'refund.amount':
            alreadyRefunded + amount,
          'refund.requestedAt':
            refund.requestedAt,
        },
      },
    );

    // -----------------------------------------
    // Notify customer
    // -----------------------------------------
    await notify(
      String(customerId),
      'refund.updated',
      {
        refundId: refund.id,
        paymentId: payment.id,
        bookingId:
          payment.bookingId.toString(),
        amount,
        status: 'requested',
        reason: refund.reason,
      },
    );

    // -----------------------------------------
    // Audit
    // -----------------------------------------
    await auditService.recordAudit({
      actor: adminId,
      action: 'refund.requested',
      entity: 'Refund',
      entityId: refund.id,
      before: null,
      after: {
        status: 'requested',
        amount,
        paymentId: payment.id,
        bookingId:
          payment.bookingId.toString(),
      },
      ip,
      result: 'Success',
    });

    return refund;
  }

  /**
   * Approve or reject a refund.
   *
   * PATCH /admin/refunds/:id
   */
  async updateRefund(
    input: UpdateRefundServiceInput,
  ) {
    const {
      refundId,
      action,
      rejectionReason,
      adminId,
      ip,
    } = input;

    // -----------------------------------------
    // Validate refund ID
    // -----------------------------------------
    if (!isObjectId(refundId)) {
      throw new AppError(
        400,
        'INVALID_REFUND_ID',
        'Invalid refund ID',
      );
    }

    // -----------------------------------------
    // Validate admin ID
    // -----------------------------------------
    if (!isObjectId(adminId)) {
      throw new AppError(
        400,
        'INVALID_ADMIN_ID',
        'Invalid admin ID',
      );
    }

    // -----------------------------------------
    // Validate action
    // -----------------------------------------
    if (
      action !== 'approve' &&
      action !== 'reject'
    ) {
      throw new AppError(
        400,
        'INVALID_REFUND_ACTION',
        'Refund action must be approve or reject',
      );
    }

    // -----------------------------------------
    // Find refund
    // -----------------------------------------
    const refund =
      await RefundModel.findById(refundId);

    if (!refund) {
      throw new AppError(
        404,
        'REFUND_NOT_FOUND',
        'Refund request not found',
      );
    }

    // -----------------------------------------
    // Only requested refunds can be updated
    // -----------------------------------------
    if (refund.status !== 'requested') {
      throw new AppError(
        409,
        'REFUND_ALREADY_PROCESSED',
        `Refund is already ${refund.status}`,
      );
    }

    // -----------------------------------------
    // Find payment
    // -----------------------------------------
    const payment =
      await PaymentModel.findById(
        refund.paymentId,
      );

    if (!payment) {
      throw new AppError(
        404,
        'PAYMENT_NOT_FOUND',
        'Payment record not found',
      );
    }

    // =========================================
    // REJECT REFUND
    // =========================================
    if (action === 'reject') {
      const before = {
        status: refund.status,
        amount: refund.amount,
      };

      refund.status = 'rejected';

      refund.rejectedBy =
        new Types.ObjectId(adminId);

      refund.rejectedAt = new Date();

      refund.rejectionReason =
        rejectionReason?.trim() ||
        'Refund rejected by admin';

      await refund.save();

      // ---------------------------------------
      // Check other active refund requests
      // ---------------------------------------
      const otherActiveRefunds =
        await RefundModel.exists({
          paymentId: payment._id,
          _id: { $ne: refund._id },
          status: {
            $in: ['requested', 'approved'],
          },
        });

      if (!otherActiveRefunds) {
        await PaymentModel.updateOne(
          { _id: payment._id },
          {
            $set: {
              'refund.status': 'rejected',
            },
          },
        );
      }

      // ---------------------------------------
      // Notify customer
      // ---------------------------------------
      await notify(
        String(refund.customerId),
        'refund.updated',
        {
          refundId: refund.id,
          paymentId: payment.id,
          bookingId:
            refund.bookingId.toString(),
          amount: refund.amount,
          status: 'rejected',
          reason: refund.rejectionReason,
        },
      );

      // ---------------------------------------
      // Audit
      // ---------------------------------------
      await auditService.recordAudit({
        actor: adminId,
        action: 'refund.rejected',
        entity: 'Refund',
        entityId: refund.id,
        before,
        after: {
          status: refund.status,
          rejectionReason:
            refund.rejectionReason,
        },
        ip,
        result: 'Success',
      });

      return refund;
    }

    // =========================================
    // APPROVE + PROCESS REFUND
    // =========================================

    // -----------------------------------------
    // Razorpay payment ID required
    // -----------------------------------------
    if (!payment.razorpayPaymentId) {
      throw new AppError(
        400,
        'RAZORPAY_PAYMENT_ID_MISSING',
        'Paid payment does not contain a Razorpay payment ID',
      );
    }

    // -----------------------------------------
    // Currency validation
    // -----------------------------------------
    if (
      payment.currency.toUpperCase() !== 'INR'
    ) {
      throw new AppError(
        400,
        'UNSUPPORTED_CURRENCY',
        'Only INR refunds are currently supported',
      );
    }

    const before = {
      status: refund.status,
      amount: refund.amount,
    };

    // -----------------------------------------
    // Re-check refundable amount
    // -----------------------------------------
    const alreadyRefunded =
      await getRefundedAmount(payment._id);

    const otherReservedRefunds =
      await RefundModel.find({
        paymentId: payment._id,
        _id: { $ne: refund._id },
        status: 'requested',
      })
        .select('amount')
        .lean();

    const reservedByOthers =
      otherReservedRefunds.reduce(
        (total, item) => total + item.amount,
        0,
      );

    const remainingAmount =
      payment.amount -
      alreadyRefunded -
      reservedByOthers;

    if (refund.amount > remainingAmount) {
      throw new AppError(
        400,
        'REFUND_EXCEEDS_PAID_AMOUNT',
        `Refund amount cannot exceed the remaining refundable amount of ₹${Math.max(
          remainingAmount,
          0,
        ).toFixed(2)}`,
        {
          paidAmount: payment.amount,
          alreadyRefunded,
          reservedByOthers,
          remainingAmount: Math.max(
            remainingAmount,
            0,
          ),
        },
      );
    }

    // -----------------------------------------
    // Call Razorpay BEFORE marking processed
    // -----------------------------------------
    try {
      console.log(
        '========== RAZORPAY REFUND REQUEST ==========',
      );
      console.log(
        'Payment ID:',
        payment.razorpayPaymentId,
      );
      console.log(
        'Refund Amount INR:',
        refund.amount,
      );
      console.log(
        'Refund Amount Paise:',
        toPaise(refund.amount),
      );
      console.log(
        '=============================================',
      );

      const razorpayRefund =
        await getRazorpay().payments.refund(
          payment.razorpayPaymentId,
          {
            amount: toPaise(refund.amount),
          },
        );

      // ---------------------------------------
      // Razorpay succeeded
      // ---------------------------------------
      refund.status = 'processed';

      refund.approvedBy =
        new Types.ObjectId(adminId);

      refund.approvedAt = new Date();

      refund.processedAt = new Date();

      refund.razorpayRefundId =
        razorpayRefund.id;

      await refund.save();

      // ---------------------------------------
      // Calculate total processed refunds
      // ---------------------------------------
      const totalRefunded =
        await getRefundedAmount(
          payment._id,
        );

      const fullyRefunded =
        totalRefunded >= payment.amount;

      // ---------------------------------------
      // Update payment
      // ---------------------------------------
      await PaymentModel.updateOne(
        { _id: payment._id },
        {
          $set: {
            ...(fullyRefunded
              ? {
                  status:
                    'REFUNDED' as const,
                }
              : {}),
            'refund.status':
              'processed',
            'refund.amount':
              totalRefunded,
            'refund.requestedAt':
              refund.requestedAt,
          },
        },
      );

      // ---------------------------------------
      // Update booking when fully refunded
      // ---------------------------------------
      if (fullyRefunded) {
        await BookingModel.updateOne(
          { _id: refund.bookingId },
          {
            $set: {
              paymentStatus: 'REFUNDED',
            },
          },
        );
      }

      // ---------------------------------------
      // Notify customer
      // ---------------------------------------
      await notify(
        String(refund.customerId),
        'refund.updated',
        {
          refundId: refund.id,
          paymentId: payment.id,
          bookingId:
            refund.bookingId.toString(),
          amount: refund.amount,
          status: 'processed',
          razorpayRefundId:
            refund.razorpayRefundId,
        },
      );

      // ---------------------------------------
      // Audit successful refund
      // ---------------------------------------
      await auditService.recordAudit({
        actor: adminId,
        action: 'refund.processed',
        entity: 'Refund',
        entityId: refund.id,
        before,
        after: {
          status: refund.status,
          amount: refund.amount,
          razorpayRefundId:
            refund.razorpayRefundId,
        },
        ip,
        result: 'Success',
      });

      console.log(
        '========== RAZORPAY REFUND SUCCESS ==========',
      );
      console.log(
        'Refund ID:',
        refund.id,
      );
      console.log(
        'Razorpay Refund ID:',
        refund.razorpayRefundId,
      );
      console.log(
        'Status:',
        refund.status,
      );
      console.log(
        '=============================================',
      );

      return refund;
    } catch (error) {
      // =======================================
      // Log Razorpay error
      // =======================================
      console.error(
        '========== RAZORPAY REFUND ERROR ==========',
      );

      if (error instanceof Error) {
        console.error(
          'Message:',
          error.message,
        );

        console.error(
          'Name:',
          error.name,
        );

        if (error.stack) {
          console.error(
            'Stack:',
            error.stack,
          );
        }

        const razorpayError =
          error as Error & {
            statusCode?: number;
            error?: {
              code?: string;
              description?: string;
              reason?: string;
              source?: string;
              step?: string;
              metadata?: unknown;
            };
          };

        if (razorpayError.statusCode) {
          console.error(
            'Status Code:',
            razorpayError.statusCode,
          );
        }

        if (razorpayError.error) {
          console.error(
            'Razorpay Error:',
            JSON.stringify(
              razorpayError.error,
              null,
              2,
            ),
          );
        }
      } else {
        console.error(
          'Unknown Razorpay error:',
          error,
        );
      }

      console.error(
        '============================================',
      );

      // ---------------------------------------
      // Keep request retryable
      // ---------------------------------------
      refund.status = 'requested';

      refund.approvedBy = undefined;
      refund.approvedAt = undefined;
      refund.processedAt = undefined;
      refund.razorpayRefundId = undefined;

      refund.rejectedBy = undefined;
      refund.rejectedAt = undefined;
      refund.rejectionReason = undefined;

      await refund.save();

      // ---------------------------------------
      // Restore payment refund state
      // ---------------------------------------
      const otherActiveRefunds =
        await RefundModel.exists({
          paymentId: payment._id,
          _id: { $ne: refund._id },
          status: {
            $in: ['requested', 'approved'],
          },
        });

      await PaymentModel.updateOne(
        { _id: payment._id },
        {
          $set: {
            'refund.status':
              otherActiveRefunds
                ? 'requested'
                : 'requested',
          },
        },
      );

      // ---------------------------------------
      // Notify customer
      // ---------------------------------------
      await notify(
        String(refund.customerId),
        'refund.updated',
        {
          refundId: refund.id,
          paymentId: payment.id,
          bookingId:
            refund.bookingId.toString(),
          amount: refund.amount,
          status: 'requested',
          reason:
            'Razorpay refund failed. Refund request can be retried.',
        },
      );

      // ---------------------------------------
      // Audit failed attempt
      // ---------------------------------------
      await auditService.recordAudit({
        actor: adminId,
        action: 'refund.processing_failed',
        entity: 'Refund',
        entityId: refund.id,
        before,
        after: {
          status: 'requested',
          reason:
            'Razorpay refund failed',
        },
        ip,
        result: 'Failed',
      });

      // ---------------------------------------
      // Safe API error
      // ---------------------------------------
      throw new AppError(
        502,
        'REFUND_FAILED',
        'Razorpay refund failed',
        error instanceof Error
          ? {
              reason: error.message,
            }
          : undefined,
      );
    }
  }

  /**
   * Get admin refund list.
   *
   * GET /admin/refunds
   */
  async listRefunds(query: {
    status?: RefundRequestStatus;
    paymentId?: string;
    bookingId?: string;
    customerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    // -----------------------------------------
    // Pagination
    // -----------------------------------------
    const page = Math.max(
      query.page ?? 1,
      1,
    );

    const limit = Math.min(
      Math.max(
        query.limit ?? 20,
        1,
      ),
      100,
    );

    const filter: Record<
      string,
      unknown
    > = {};

    // -----------------------------------------
    // Status filter
    // -----------------------------------------
    if (query.status) {
      filter.status = query.status;
    }

    // -----------------------------------------
    // Payment filter
    // -----------------------------------------
    if (
      query.paymentId &&
      isObjectId(query.paymentId)
    ) {
      filter.paymentId =
        new Types.ObjectId(
          query.paymentId,
        );
    }

    // -----------------------------------------
    // Booking filter
    // -----------------------------------------
    if (
      query.bookingId &&
      isObjectId(query.bookingId)
    ) {
      filter.bookingId =
        new Types.ObjectId(
          query.bookingId,
        );
    }

    // -----------------------------------------
    // Customer filter
    // -----------------------------------------
    if (
      query.customerId &&
      isObjectId(query.customerId)
    ) {
      filter.customerId =
        new Types.ObjectId(
          query.customerId,
        );
    }

    // -----------------------------------------
    // Search by ObjectId
    // -----------------------------------------
    if (query.search?.trim()) {
      const search =
        query.search.trim();

      if (isObjectId(search)) {
        const objectId =
          new Types.ObjectId(search);

        filter.$or = [
          { _id: objectId },
          { paymentId: objectId },
          { bookingId: objectId },
          { customerId: objectId },
        ];
      }
    }

    // -----------------------------------------
    // Fetch refunds + total
    // -----------------------------------------
    const [items, total] =
      await Promise.all([
        RefundModel.find(filter)
          .populate(
            'paymentId',
            'razorpayPaymentId razorpayOrderId amount currency method status',
          )
          .populate(
            'bookingId',
            'customerId serviceName paymentStatus',
          )
          .populate(
            'customerId',
            'name email phone',
          )
          .populate(
            'requestedBy',
            'name email',
          )
          .populate(
            'approvedBy',
            'name email',
          )
          .populate(
            'rejectedBy',
            'name email',
          )
          .sort({
            createdAt: -1,
          })
          .skip(
            (page - 1) * limit,
          )
          .limit(limit)
          .lean(),

        RefundModel.countDocuments(
          filter,
        ),
      ]);

    // -----------------------------------------
    // Return paginated result
    // -----------------------------------------
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(
          total / limit,
        ),
      },
    };
  }
}

export const refundsService =
  new RefundsService();