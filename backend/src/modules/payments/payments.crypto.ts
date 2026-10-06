import crypto from 'crypto';

const hmacHex = (secret: string, data: string | Buffer): string =>
  crypto.createHmac('sha256', secret).update(data).digest('hex');

/** Constant-time compare that is safe for inputs of different length. */
export const safeEqualHex = (expected: string, actual: string): boolean => {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

/** Checkout callback: HMAC_SHA256(order_id|payment_id, key_secret). */
export const verifyCheckoutSignature = (
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean => !!secret && !!signature && safeEqualHex(hmacHex(secret, `${orderId}|${paymentId}`), signature);

/** Webhook: HMAC_SHA256(raw request body, webhook_secret). Must be computed on the RAW bytes. */
export const verifyWebhookSignature = (rawBody: Buffer, signature: string, secret: string): boolean =>
  !!secret && !!signature && rawBody.length > 0 && safeEqualHex(hmacHex(secret, rawBody), signature);

export const signWebhookBody = (rawBody: Buffer | string, secret: string): string => hmacHex(secret, rawBody);

/** INR (may carry paise) -> integer paise. Rounds to kill float noise like 1499.0000001. */
export const toPaise = (inr: number): number => Math.round(inr * 100);
