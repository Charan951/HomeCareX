import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    /** Exact request bytes, captured by express.json's `verify` hook (used for webhook HMAC). */
    rawBody?: Buffer;
  }
}
