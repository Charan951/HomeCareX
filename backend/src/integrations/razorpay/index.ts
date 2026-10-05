import Razorpay from 'razorpay';
import crypto from 'crypto';

/** Built lazily: dotenv may not have run yet when this module is first imported. */
export const getRazorpay = (): Razorpay => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing from .env');
  }
  return new Razorpay({ key_id, key_secret });
};

export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string): boolean => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};