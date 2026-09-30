import type { Response } from 'express';
import type { ErrorCode } from '../constants/errorcodes';

/** Every successful response: { success: true, data, message?, meta? } */
export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

/** Every failed response: { success: false, message, code, details? } */
export interface ErrorEnvelope {
  success: false;
  message: string;
  code: ErrorCode;
  details?: { field: string; message: string }[];
}

interface SendOptions {
  status?: number;
  message?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(res: Response, data: T, options: SendOptions = {}): Response {
  const body: SuccessEnvelope<T> = { success: true, data };
  if (options.message) body.message = options.message;
  if (options.meta) body.meta = options.meta;
  return res.status(options.status ?? 200).json(body);
}