import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Booking } from '../../models/Booking';
import { PaymentModel } from '../../models/Payment';
import { UserModel } from '../../models/User';
import { getAuthUser } from '../../middleware/auth.middleware';
import { getRazorpay, verifyRazorpaySignature } from '../../integrations/razorpay';
import { AppError } from '../../utils/AppError';
import { BOOKING_HOLD_MS } from '../bookings/bookings.constants';

const isId = (v: unknown): v is string => typeof v === 'string' && Types.ObjectId.isValid(v);
const str = (v: unknown): v is string => typeof v === 'string' && v.length > 0 && v.length < 200;

/** Booking as the client may see it: no signature / internal fields. */
function toClient(doc: { toObject: () => Record<string, any> }) {
  const { requestHash, idempotencyKey, slotSeat, __v, ...rest } = doc.toObject();
  if (rest.paymentDetails) delete rest.paymentDetails.signature;
  return rest;
}

/** POST /payments/create-order  { bookingId } — amount ALWAYS comes from the stored price snapshot. */
export const createPaymentOrder = async (req: Request, res: Response): Promise<void> => {
  const { id: customerId } = getAuthUser(req);
  const { bookingId } = req.body ?? {};
  if (!isId(bookingId)) throw new AppError(400, 'VALIDATION_ERROR', 'A valid bookingId is required');

  const booking = await Booking.findOne({ _id: bookingId, customerId });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  if (booking.paymentStatus === 'PAID') throw new AppError(409, 'ALREADY_PAID', 'This booking is already paid');
  if (booking.status !== 'PENDING_PAYMENT') {
    throw new AppError(409, 'BOOKING_NOT_PAYABLE', 'This booking can no longer be paid. Please start a new booking.');
  }
  if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() <= Date.now()) {
    throw new AppError(409, 'HOLD_EXPIRED', 'Your slot reservation expired. Please try again.');
  }

  const totalInr = Number((booking.priceSnapshot as { total: number }).total);
  if (!Number.isFinite(totalInr) || totalInr <= 0) throw new AppError(422, 'INVALID_AMOUNT', 'Invalid booking amount');

  // Give the customer a fresh window for each payment attempt.
  await Booking.updateOne(
    { _id: booking._id, status: 'PENDING_PAYMENT' },
    { $set: { holdExpiresAt: new Date(Date.now() + BOOKING_HOLD_MS) } }
  );

  const user = await UserModel.findById(customerId).select('name email phone').lean();
  const prefill = { name: user?.name ?? '', email: user?.email ?? '', contact: user?.phone ?? '' };

  // Reuse the still-open order for this booking (retry after cancel/failure).
  const open = await PaymentModel.findOne({ bookingId: booking._id, status: 'PENDING' }).sort({ createdAt: -1 });
  if (open && open.amount === totalInr) {
    res.json({
      success: true,
      data: { orderId: open.razorpayOrderId, amount: totalInr * 100, currency: 'INR', keyId: process.env.RAZORPAY_KEY_ID, prefill },
    });
    return;
  }

  const order = await getRazorpay().orders.create({
    amount: totalInr * 100, // paise
    currency: 'INR',
    receipt: `rcpt_${String(booking._id).slice(-12)}_${Date.now().toString().slice(-8)}`,
    notes: { bookingId: String(booking._id), customerId },
  });

  await PaymentModel.create({
    bookingId: booking._id,
    customerId: new Types.ObjectId(customerId),
    razorpayOrderId: order.id,
    amount: totalInr,
    currency: 'INR',
    status: 'PENDING',
  });
  await Booking.updateOne({ _id: booking._id }, { $set: { 'paymentDetails.orderId': order.id } });

  res.json({
    success: true,
    data: { orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID, prefill },
  });
};

/**
 * POST /payments/verify  { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Idempotent: a repeat of an already-successful verification returns the same booking (200, replayed).
 */
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  const { id: customerId } = getAuthUser(req);
  const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } =
    req.body ?? {};
  if (!isId(bookingId) || !str(orderId) || !str(paymentId) || !str(signature)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Missing payment details');
  }

  const booking = await Booking.findOne({ _id: bookingId, customerId });
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');

  // Replay of an already-confirmed payment -> same booking, no second write.
  if (booking.paymentStatus === 'PAID') {
    if (booking.paymentDetails?.paymentId === paymentId) {
      res.json({ success: true, replayed: true, data: toClient(booking) });
      return;
    }
    throw new AppError(409, 'ALREADY_PAID', 'This booking is already paid');
  }

  // The order must be one WE created for THIS booking and customer.
  const payment = await PaymentModel.findOne({ razorpayOrderId: orderId, bookingId: booking._id });
  if (!payment || String(payment.customerId) !== customerId) {
    throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment verification failed');
  }

  if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
    await PaymentModel.updateOne({ _id: payment._id }, { $set: { errorReason: 'Invalid signature' } });
    throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment verification failed');
  }

  // Amount / currency / order, straight from Razorpay (never from the client).
  const rp = await getRazorpay().payments.fetch(paymentId);
  const expectedPaise = Number((booking.priceSnapshot as { total: number }).total) * 100;
  const okStatus = rp.status === 'captured' || rp.status === 'authorized';
  if (rp.order_id !== orderId || rp.currency !== 'INR' || Number(rp.amount) !== expectedPaise || !okStatus) {
    await PaymentModel.updateOne({ _id: payment._id }, { $set: { errorReason: 'Amount/order mismatch' } });
    throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment verification failed');
  }

  const now = new Date();
  // Atomic PENDING_PAYMENT -> CONFIRMED. Only one concurrent request can win this.
  const updated = await Booking.findOneAndUpdate(
    { _id: booking._id, customerId, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
    {
      $set: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        'paymentDetails.orderId': orderId,
        'paymentDetails.paymentId': paymentId,
        'paymentDetails.signature': signature,
        'paymentDetails.status': 'PAID',
        'paymentDetails.paidAt': now,
      },
      $unset: { holdExpiresAt: 1 },
      $push: {
        history: {
          from: 'PENDING_PAYMENT',
          to: 'CONFIRMED',
          at: now,
          actorId: new Types.ObjectId(customerId),
          actorRole: 'customer',
          note: 'Payment verified',
        },
      },
    },
    { new: true }
  );

  if (!updated) {
    const fresh = await Booking.findById(booking._id);
    if (fresh?.paymentStatus === 'PAID' && fresh.paymentDetails?.paymentId === paymentId) {
      res.json({ success: true, replayed: true, data: toClient(fresh) }); // lost a harmless race
      return;
    }
    // Customer paid but the seat was released (hold lapsed and someone else took it).
    await PaymentModel.updateOne(
      { _id: payment._id },
      { $set: { razorpayPaymentId: paymentId, errorReason: 'PAID_BUT_SLOT_LOST: refund required' } }
    );
    throw new AppError(409, 'SLOT_UNAVAILABLE', 'This slot is no longer available. Please select another slot.');
  }

  await PaymentModel.updateOne(
    { _id: payment._id },
    { $set: { status: 'PAID', razorpayPaymentId: paymentId, razorpaySignature: signature, method: rp.method, paidAt: now } }
  );

  res.json({ success: true, replayed: false, data: toClient(updated) });
};

/**
 * POST /payments/attempt  { bookingId, orderId?, kind: 'CANCELLED' | 'FAILED', reason? }
 * Bookkeeping only. A cancelled/failed attempt must NOT cancel the booking — the order stays
 * payable until the hold expires, so "Retry Payment" works.
 */
export const recordPaymentAttempt = async (req: Request, res: Response): Promise<void> => {
  const { id: customerId } = getAuthUser(req);
  const { bookingId, orderId, kind, reason } = req.body ?? {};
  if (!isId(bookingId) || (kind !== 'CANCELLED' && kind !== 'FAILED')) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid request');
  }
  const owned = await Booking.exists({ _id: bookingId, customerId });
  if (!owned) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');

  await PaymentModel.updateOne(
    { bookingId, status: 'PENDING', ...(str(orderId) ? { razorpayOrderId: orderId } : {}) },
    { $set: { errorReason: `${kind}: ${typeof reason === 'string' ? reason.slice(0, 200) : 'no reason'}` } }
  );
  res.json({ success: true });
};