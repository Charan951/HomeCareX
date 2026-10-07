import { BookingModel, type IBooking } from '../../models/Booking';
import { PaymentModel, type IPayment } from '../../models/Payment';
import { BOOKING_STATUS } from '../bookings/bookings.constants';
import { codOrderId, isCodOnlinePayableStatus } from './payments.constants';

export type SettleOutcome =
  | { kind: 'confirmed'; booking: IBooking }
  | { kind: 'replayed'; booking: IBooking }
  | { kind: 'duplicate' }
  | { kind: 'slot_lost' }
  | { kind: 'missing' };

export interface SettleInput {
  payment: IPayment;
  paymentId: string;
  signature?: string;
  method?: string;
  actor: { role: 'customer' | 'system'; id?: string };
  reason: string;
}

const refundRequest = (amount: number) => ({ 'refund.status': 'requested' as const, 'refund.amount': amount, 'refund.requestedAt': new Date() });

/**
 * Turns a captured Razorpay payment into a CONFIRMED + PAID booking.
 * Shared by POST /payments/verify and the webhook, so both are safe to run together, twice, or
 * in any order: the booking flip is one atomic conditional update and only one caller can win it.
 * The caller must already have verified the signature and the amount.
 */
export async function settleCapturedPayment(input: SettleInput): Promise<SettleOutcome> {
  const { payment, paymentId, signature, method, actor, reason } = input;
  const now = new Date();

  const markPaymentPaid = () =>
    PaymentModel.updateOne(
      { _id: payment._id, status: { $ne: 'PAID' } },
      {
        $set: {
          status: 'PAID',
          razorpayPaymentId: paymentId,
          ...(signature ? { razorpaySignature: signature } : {}),
          ...(method ? { method } : {}),
          paidAt: now,
        },
        $unset: { errorReason: 1 },
      },
    );

  const booking = await BookingModel.findById(payment.bookingId);
  if (!booking) return { kind: 'missing' };

  // Already paid: same payment id = replay (no second write); different id = a second charge.
  if (booking.paymentStatus === 'PAID') {
    if (booking.paymentDetails?.paymentId === paymentId) {
      await markPaymentPaid();
      return { kind: 'replayed', booking };
    }
    await PaymentModel.updateOne(
      { _id: payment._id },
      { $set: { razorpayPaymentId: paymentId, status: 'PAID', paidAt: now, errorReason: 'DUPLICATE_PAYMENT: refund required', ...refundRequest(payment.amount) } },
    );
    return { kind: 'duplicate' };
  }

  // Atomic PENDING_PAYMENT -> CONFIRMED. Exactly one concurrent caller matches this filter.
  const updated = await BookingModel.findOneAndUpdate(
    { _id: booking._id, status: BOOKING_STATUS.PENDING_PAYMENT, paymentStatus: 'PENDING' },
    {
      $set: {
        status: BOOKING_STATUS.CONFIRMED,
        paymentStatus: 'PAID',
        'paymentDetails.orderId': payment.razorpayOrderId,
        'paymentDetails.paymentId': paymentId,
        ...(signature ? { 'paymentDetails.signature': signature } : {}),
        'paymentDetails.status': 'PAID',
        'paymentDetails.paidAt': now,
      },
      $unset: { holdExpiresAt: 1 },
      $push: {
        statusHistory: {
          from: BOOKING_STATUS.PENDING_PAYMENT,
          to: BOOKING_STATUS.CONFIRMED,
          at: now,
          actorId: actor.id,
          actorRole: actor.role,
          reason,
        },
      },
    },
    { new: true },
  );
  if (updated) {
    await markPaymentPaid();
    return { kind: 'confirmed', booking: updated };
  }

  const fresh = await BookingModel.findById(booking._id);
  if (!fresh) return { kind: 'missing' };

  // Lost a harmless race to the other path (verify vs webhook) that used the same payment.
  if (fresh.paymentStatus === 'PAID' && fresh.paymentDetails?.paymentId === paymentId) {
    await markPaymentPaid();
    return { kind: 'replayed', booking: fresh };
  }

  // Customer chose Cash on Service, but an earlier online order still got paid: upgrade to PAID.
  if (isCodOnlinePayableStatus(fresh.status) && fresh.paymentStatus === 'PENDING') {
    const cod = await PaymentModel.findOne({ bookingId: fresh._id, razorpayOrderId: codOrderId(String(fresh._id)), status: 'PENDING' });
    if (cod) {
      const upgraded = await BookingModel.findOneAndUpdate(
        { _id: fresh._id, paymentStatus: 'PENDING' },
        {
          $set: {
            paymentStatus: 'PAID',
            'paymentDetails.orderId': payment.razorpayOrderId,
            'paymentDetails.paymentId': paymentId,
            'paymentDetails.status': 'PAID',
            'paymentDetails.paidAt': now,
          },
        },
        { new: true },
      );
      if (upgraded) {
        await PaymentModel.updateOne({ _id: cod._id }, { $set: { status: 'FAILED', errorReason: 'Superseded by online payment' } });
        await markPaymentPaid();
        return { kind: 'confirmed', booking: upgraded };
      }
    }
  }

  // Paid, but the seat was released (hold lapsed / booking cancelled): flag for refund.
  await PaymentModel.updateOne(
    { _id: payment._id },
    { $set: { razorpayPaymentId: paymentId, status: 'PAID', paidAt: now, errorReason: 'PAID_BUT_SLOT_LOST: refund required', ...refundRequest(payment.amount) } },
  );
  return { kind: 'slot_lost' };
}