import { createHash } from 'crypto';
import { Types } from 'mongoose';
import { BookingModel, type IBooking } from '../../models/Booking';
import { PaymentModel, type IPayment } from '../../models/Payment';
import { PaymentEventModel } from '../../models/PaymentEvent';
import { UserModel } from '../../models/User';
import { getRazorpay } from '../../integrations/razorpay';
import { AppError } from '../../utils/AppError';
import { BOOKING_HOLD_MS, BOOKING_STATUS } from '../bookings/bookings.constants';
import { withSlotLock } from '../bookings/bookings.lock';
import { PAYMENT_MAX_ATTEMPTS, WEBHOOK_EVENTS, codOrderId, isCodOnlinePayableStatus } from './payments.constants';
import { toPaise, verifyCheckoutSignature, verifyWebhookSignature } from './payments.crypto';
import { settleCapturedPayment, type SettleOutcome } from './payments.settle';
import type { ListQuery } from './payments.validation';
import type { PaymentListItem, PaymentListResult, RazorpayPaymentEntity, WebhookPayload, WebhookResult } from './payments.types';

/** Booking as the client may see it: no signature / internal fields. */
function toClient(booking: IBooking): Record<string, unknown> {
  const { requestHash: _r, idempotencyKey: _i, slotSeat: _s, __v: _v, ...rest } = booking.toObject() as Record<string, unknown> & {
    paymentDetails?: Record<string, unknown>;
  };
  if (rest.paymentDetails) {
    const { signature: _sig, ...details } = rest.paymentDetails;
    rest.paymentDetails = details;
  }
  return rest;
}

const bookingTotalPaise = (booking: IBooking): number => toPaise(Number(booking.priceSnapshot?.total));

/** Amount, currency and state of a Razorpay payment must match the booking's server-side price. */
export const entityMatchesBooking = (entity: RazorpayPaymentEntity, orderId: string, booking: IBooking): boolean =>
  entity.order_id === orderId &&
  entity.currency === 'INR' &&
  entity.amount === bookingTotalPaise(booking) &&
  (entity.status === 'captured' || entity.status === 'authorized');

async function loadOwnedBooking(bookingId: string, customerId: string): Promise<IBooking> {
  const booking = await BookingModel.findOne({ _id: bookingId, customerId });
  // Someone else's booking looks exactly like a missing one: no id probing.
  if (!booking) throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  return booking;
}

/**
 * Remember on the booking that the last online payment attempt failed, so My Bookings can say "Payment failed".
 * Only while payment is still PENDING: a paid booking is never flagged. A later successful payment overwrites this
 * with 'PAID' (see settleCapturedPayment) and a new order resets it to 'PENDING'.
 */
async function markPaymentFailed(bookingId: string): Promise<void> {
  await BookingModel.updateOne({ _id: bookingId, paymentStatus: 'PENDING' }, { $set: { 'paymentDetails.status': 'FAILED' } });
}

function validTotal(booking: IBooking): number {
  const total = Number(booking.priceSnapshot?.total);
  if (!Number.isFinite(total) || total <= 0) throw new AppError(422, 'INVALID_AMOUNT', 'Invalid booking amount');
  return total;
}

/**
 * Like assertPayable, but also lets a Cash-on-Service booking (already CONFIRMED or later, payment still PENDING)
 * pay online from My Bookings. The amount still comes from the stored price snapshot.
 */
async function assertOrderable(booking: IBooking): Promise<number> {
  if (booking.paymentStatus === 'PAID') throw new AppError(409, 'ALREADY_PAID', 'This booking is already paid');
  if (booking.status === BOOKING_STATUS.PENDING_PAYMENT) return assertPayable(booking);
  const codPending =
    booking.paymentStatus === 'PENDING' &&
    isCodOnlinePayableStatus(booking.status) &&
    (await PaymentModel.exists({ bookingId: booking._id, razorpayOrderId: codOrderId(String(booking._id)), status: 'PENDING' }));
  if (!codPending) throw new AppError(409, 'BOOKING_NOT_PAYABLE', 'This booking can no longer be paid. Please start a new booking.');
  return validTotal(booking);
}

function assertPayable(booking: IBooking): number {
  if (booking.paymentStatus === 'PAID') throw new AppError(409, 'ALREADY_PAID', 'This booking is already paid');
  if (booking.status !== BOOKING_STATUS.PENDING_PAYMENT) {
    throw new AppError(409, 'BOOKING_NOT_PAYABLE', 'This booking can no longer be paid. Please start a new booking.');
  }
  if (booking.holdExpiresAt && booking.holdExpiresAt.getTime() <= Date.now()) {
    throw new AppError(409, 'HOLD_EXPIRED', 'Your slot reservation expired. Please try again.');
  }
  return validTotal(booking);
}

export const paymentsService = {
  /** POST /payments/order. Amount ALWAYS comes from the stored price snapshot. */
  async createOrder(customerId: string, bookingId: string) {
    // Serialise per booking so a double click can never create two Razorpay orders.
    return withSlotLock(`payment-order:${bookingId}`, async () => {
      const booking = await loadOwnedBooking(bookingId, customerId);
      const totalInr = await assertOrderable(booking);
      await BookingModel.updateOne({ _id: booking._id, 'paymentDetails.status': 'FAILED' }, { $set: { 'paymentDetails.status': 'PENDING' } });

      const history = await PaymentModel.find({ bookingId: booking._id, razorpayOrderId: { $not: /^cod_/ } }).select('attempts').lean();
      const used = history.reduce((sum, p) => sum + (p.attempts ?? 0), 0);
      if (used >= PAYMENT_MAX_ATTEMPTS) {
        throw new AppError(429, 'PAYMENT_ATTEMPTS_EXCEEDED', 'Too many payment attempts for this booking. Please start a new booking.');
      }

      // Fresh hold window for every attempt.
      await BookingModel.updateOne(
        { _id: booking._id, status: BOOKING_STATUS.PENDING_PAYMENT },
        { $set: { holdExpiresAt: new Date(Date.now() + BOOKING_HOLD_MS) } },
      );

      const user = await UserModel.findById(customerId).select('name email phone').lean();
      const prefill = { name: user?.name ?? '', email: user?.email ?? '', contact: user?.phone ?? '' };
      const keyId = process.env.RAZORPAY_KEY_ID;

      // Retry after cancel/failure reuses the still-open order.
      const open = await PaymentModel.findOne({ bookingId: booking._id, status: 'PENDING', razorpayOrderId: { $not: /^cod_/ } }).sort({ createdAt: -1 });
      if (open && toPaise(open.amount) === toPaise(totalInr)) {
        await PaymentModel.updateOne({ _id: open._id }, { $inc: { attempts: 1 } });
        return { orderId: open.razorpayOrderId, amount: toPaise(totalInr), currency: 'INR', keyId, prefill, attempt: used + 1 };
      }

      let order: { id: string; amount: number | string; currency: string };
      try {
        order = await getRazorpay().orders.create({
          amount: toPaise(totalInr),
          currency: 'INR',
          receipt: `rcpt_${String(booking._id).slice(-12)}_${Date.now().toString().slice(-8)}`,
          notes: { bookingId: String(booking._id), customerId },
        });
      } catch {
        throw new AppError(502, 'GATEWAY_ERROR', 'The payment gateway is unavailable. Please try again in a moment.');
      }

      await PaymentModel.create({
        bookingId: booking._id,
        customerId: new Types.ObjectId(customerId),
        razorpayOrderId: order.id,
        amount: totalInr,
        currency: 'INR',
        status: 'PENDING',
        attempts: 1,
      });
      await BookingModel.updateOne({ _id: booking._id }, { $set: { 'paymentDetails.orderId': order.id } });

      return { orderId: order.id, amount: Number(order.amount), currency: order.currency, keyId, prefill, attempt: used + 1 };
    });
  },

  /** POST /payments/verify. Idempotent: repeating a successful verification returns the same booking. */
  async verify(customerId: string, body: { bookingId: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = body;
    const booking = await loadOwnedBooking(bookingId, customerId);

    if (booking.paymentStatus === 'PAID') {
      if (booking.paymentDetails?.paymentId === paymentId) return { replayed: true, booking: toClient(booking) };
      throw new AppError(409, 'ALREADY_PAID', 'This booking is already paid');
    }

    // The order must be one WE created for THIS booking and customer.
    const payment = await PaymentModel.findOne({ razorpayOrderId: orderId, bookingId: booking._id });
    if (!payment || String(payment.customerId) !== customerId) {
      throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment verification failed');
    }

    if (!verifyCheckoutSignature(orderId, paymentId, signature, process.env.RAZORPAY_KEY_SECRET ?? '')) {
      await PaymentModel.updateOne({ _id: payment._id }, { $set: { errorReason: 'Invalid signature' } });
      throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment verification failed');
    }

    // Amount / currency / order come from Razorpay itself, never from the client.
    let entity: RazorpayPaymentEntity;
    try {
      const rp = await getRazorpay().payments.fetch(paymentId);
      entity = { id: rp.id, order_id: rp.order_id, amount: Number(rp.amount), currency: rp.currency, status: rp.status, method: rp.method };
    } catch {
      throw new AppError(502, 'GATEWAY_ERROR', 'Could not confirm the payment with the gateway. Please try again.');
    }
    if (!entityMatchesBooking(entity, orderId, booking)) {
      await PaymentModel.updateOne({ _id: payment._id }, { $set: { errorReason: 'Amount/order mismatch' } });
      throw new AppError(400, 'PAYMENT_VERIFICATION_FAILED', 'Payment verification failed');
    }

    const outcome = await settleCapturedPayment({
      payment,
      paymentId,
      signature,
      method: entity.method,
      actor: { role: 'customer', id: customerId },
      reason: 'Payment verified',
    });
    return this.outcomeToVerifyResult(outcome);
  },

  outcomeToVerifyResult(outcome: SettleOutcome): { replayed: boolean; booking: Record<string, unknown> } {
    switch (outcome.kind) {
      case 'confirmed':
        return { replayed: false, booking: toClient(outcome.booking) };
      case 'replayed':
        return { replayed: true, booking: toClient(outcome.booking) };
      case 'duplicate':
        throw new AppError(409, 'ALREADY_PAID', 'This booking is already paid. The extra charge will be refunded.');
      case 'slot_lost':
        throw new AppError(409, 'SLOT_UNAVAILABLE', 'This slot is no longer available. Your payment will be refunded.');
      case 'missing':
        throw new AppError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
    }
  },

  /** POST /payments/attempt: bookkeeping only; a cancelled/failed attempt never cancels the booking. */
  async recordAttempt(customerId: string, body: { bookingId: string; orderId?: string; kind: 'CANCELLED' | 'FAILED'; reason?: string }) {
    await loadOwnedBooking(body.bookingId, customerId);
    await PaymentModel.updateOne(
      { bookingId: body.bookingId, status: 'PENDING', ...(body.orderId ? { razorpayOrderId: body.orderId } : {}) },
      { $set: { errorReason: `${body.kind}: ${body.reason ?? 'no reason'}` } },
    );
    if (body.kind === 'FAILED') await markPaymentFailed(body.bookingId);
  },

  /** POST /payments/cod: booking CONFIRMED, payment stays PENDING until the partner collects cash. */
  async confirmCashOnService(customerId: string, bookingId: string) {
    const booking = await loadOwnedBooking(bookingId, customerId);
    const orderKey = codOrderId(String(booking._id));

    const existing = await PaymentModel.findOne({ razorpayOrderId: orderKey });
    if (existing && booking.status === BOOKING_STATUS.CONFIRMED) return { replayed: true, booking: toClient(booking) };

    const total = assertPayable(booking);
    const now = new Date();

    // Upsert on the unique synthetic order id: a double click cannot create two COD payments.
    await PaymentModel.updateOne(
      { razorpayOrderId: orderKey },
      {
        $setOnInsert: {
          bookingId: booking._id,
          customerId: new Types.ObjectId(customerId),
          amount: total,
          currency: 'INR',
          method: 'cod',
          status: 'PENDING',
          attempts: 1,
        },
      },
      { upsert: true },
    );

    const updated = await BookingModel.findOneAndUpdate(
      { _id: booking._id, customerId, status: BOOKING_STATUS.PENDING_PAYMENT, paymentStatus: 'PENDING' },
      {
        $set: { status: BOOKING_STATUS.CONFIRMED, 'paymentDetails.status': 'COD_PENDING' },
        $unset: { holdExpiresAt: 1 },
        $push: {
          statusHistory: {
            from: BOOKING_STATUS.PENDING_PAYMENT,
            to: BOOKING_STATUS.CONFIRMED,
            at: now,
            actorId: customerId,
            actorRole: 'customer',
            reason: 'Cash on service selected',
          },
        },
      },
      { new: true },
    );
    if (updated) return { replayed: false, booking: toClient(updated) };

    const fresh = await BookingModel.findById(booking._id);
    if (fresh && fresh.status === BOOKING_STATUS.CONFIRMED) return { replayed: true, booking: toClient(fresh) };
    throw new AppError(409, 'BOOKING_NOT_PAYABLE', 'This booking can no longer be paid. Please start a new booking.');
  },

  /** GET /payments: the signed-in customer's transactions only. */
  async list(customerId: string, query: ListQuery): Promise<PaymentListResult> {
    const filter = {
      customerId: new Types.ObjectId(customerId),
      // A Cash-on-Service placeholder replaced by an online payment is bookkeeping, not a failed payment.
      errorReason: { $ne: 'Superseded by online payment' },
      ...(query.status ? { status: query.status } : {}),
    };
    const [total, rows] = await Promise.all([
      PaymentModel.countDocuments(filter),
      PaymentModel.find(filter).sort({ createdAt: -1 }).skip((query.page - 1) * query.limit).limit(query.limit).lean(),
    ]);
    const bookings = await BookingModel.find({ _id: { $in: rows.map((r) => r.bookingId) } })
      .select('serviceName date scheduledAt')
      .lean();
    const byId = new Map(bookings.map((b) => [String(b._id), b]));

    const items: PaymentListItem[] = rows.map((r) => {
      const b = byId.get(String(r.bookingId));
      const id = String(r._id);
      return {
        id,
        bookingId: String(r.bookingId),
        bookingRef: `BK-${String(r.bookingId).slice(-5).toUpperCase()}`,
        serviceName: b?.serviceName ?? 'Home Service',
        bookingDate: b?.date ?? null,
        amount: r.amount,
        currency: r.currency,
        method: r.method ?? null,
        status: r.status,
        paidAt: r.paidAt ? r.paidAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
        receiptNo: r.status === 'PAID' ? `RCPT-${id.slice(-8).toUpperCase()}` : null,
      };
    });
    return { items, page: query.page, limit: query.limit, total };
  },
};

/* -------------------------------- webhook -------------------------------- */

/** What the webhook needs from storage; faked in tests. */
export interface WebhookStore {
  /** true = first time we see this event id; false = replay. */
  recordEvent(e: { eventId: string; event: string; orderId?: string; paymentId?: string }): Promise<boolean>;
  forgetEvent(eventId: string): Promise<void>;
  settleCaptured(entity: RazorpayPaymentEntity): Promise<{ confirmed: boolean }>;
  noteFailed(entity: RazorpayPaymentEntity): Promise<void>;
}

const isDuplicateKey = (err: unknown): boolean => (err as { code?: number })?.code === 11000;

export const mongoWebhookStore: WebhookStore = {
  async recordEvent(e) {
    try {
      await PaymentEventModel.create({ eventId: e.eventId, event: e.event, razorpayOrderId: e.orderId, razorpayPaymentId: e.paymentId });
      return true;
    } catch (err) {
      if (isDuplicateKey(err)) return false;
      throw err;
    }
  },

  async forgetEvent(eventId) {
    await PaymentEventModel.deleteOne({ eventId });
  },

  async settleCaptured(entity) {
    if (!entity.order_id) return { confirmed: false };
    const payment: IPayment | null = await PaymentModel.findOne({ razorpayOrderId: entity.order_id });
    if (!payment) return { confirmed: false }; // not an order we created
    const booking = await BookingModel.findById(payment.bookingId);
    if (!booking) return { confirmed: false };

    if (!entityMatchesBooking(entity, entity.order_id, booking)) {
      await PaymentModel.updateOne({ _id: payment._id, status: { $ne: 'PAID' } }, { $set: { errorReason: 'Amount/order mismatch (webhook)' } });
      return { confirmed: false };
    }
    const outcome = await settleCapturedPayment({
      payment,
      paymentId: entity.id,
      method: entity.method,
      actor: { role: 'system' },
      reason: 'Payment captured (webhook)',
    });
    return { confirmed: outcome.kind === 'confirmed' || outcome.kind === 'replayed' };
  },

  async noteFailed(entity) {
    if (!entity.order_id) return;
    // The order stays payable (customer can retry inside Razorpay), so we only record why it failed.
    const payment = await PaymentModel.findOneAndUpdate(
      { razorpayOrderId: entity.order_id, status: 'PENDING' },
      { $set: { errorReason: `FAILED: ${(entity.error_description ?? 'payment failed').slice(0, 200)}` } },
    );
    if (payment) await markPaymentFailed(String(payment.bookingId));
  },
};

export interface WebhookInput {
  rawBody: Buffer;
  signature: string | undefined;
  eventId: string | undefined;
  secret: string | undefined;
}

/**
 * POST /payments/webhook. Order of checks matters:
 *   1. signature on the RAW body (400 if wrong, nothing is parsed or stored before this)
 *   2. event id dedupe (replay -> 200, no side effects)
 *   3. act on the event; if that throws, forget the event id so the gateway's retry is processed.
 */
export async function processWebhook(input: WebhookInput, store: WebhookStore = mongoWebhookStore): Promise<WebhookResult> {
  if (!input.secret) throw new AppError(503, 'WEBHOOK_NOT_CONFIGURED', 'Webhook secret is not configured');
  if (!input.signature || !verifyWebhookSignature(input.rawBody, input.signature, input.secret)) {
    throw new AppError(400, 'INVALID_SIGNATURE', 'Invalid webhook signature');
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(input.rawBody.toString('utf8')) as WebhookPayload;
  } catch {
    throw new AppError(400, 'INVALID_PAYLOAD', 'Webhook body is not valid JSON');
  }

  const handled: string[] = [WEBHOOK_EVENTS.PAYMENT_CAPTURED, WEBHOOK_EVENTS.ORDER_PAID, WEBHOOK_EVENTS.PAYMENT_FAILED];
  if (typeof body.event !== 'string' || !handled.includes(body.event)) return { outcome: 'ignored' };

  const entity = body.payload?.payment?.entity;
  if (!entity?.id) return { outcome: 'ignored' };

  const eventId = input.eventId?.trim() || `body:${createHash('sha256').update(input.rawBody).digest('hex')}`;
  const first = await store.recordEvent({ eventId, event: body.event, orderId: entity.order_id, paymentId: entity.id });
  if (!first) return { outcome: 'replayed' };

  try {
    if (body.event === WEBHOOK_EVENTS.PAYMENT_FAILED) {
      await store.noteFailed(entity);
      return { outcome: 'processed', bookingConfirmed: false };
    }
    const { confirmed } = await store.settleCaptured(entity);
    return { outcome: 'processed', bookingConfirmed: confirmed };
  } catch (err) {
    await store.forgetEvent(eventId).catch(() => undefined);
    throw err;
  }
}