import type { ApiError } from './http';

export type ApiErrorKind = 'offline' | 'network' | 'timeout' | 'http' | 'unknown';

export interface ClassifiedApiError {
  kind: ApiErrorKind;
  status?: number;
  code?: string;
  message: string;
  details?: { field: string; message: string }[];
}

/**
 * Classifies frontend API errors into distinct categories:
 * - 'offline': browser network adapter is disconnected (navigator.onLine === false)
 * - 'network': backend is unreachable, refused connection, or CORS failure (error.response == null)
 * - 'timeout': request exceeded client timeout (ECONNABORTED / ETIMEDOUT)
 * - 'http': actual HTTP status response received from backend (4xx, 5xx)
 * - 'unknown': unrecognized or unexpected runtime error
 */
export function classifyApiError(
  err: unknown,
  defaultHttpMsg = 'A server error occurred. Please try again shortly.',
): ClassifiedApiError {
  // 1. Browser offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      kind: 'offline',
      status: 0,
      message: 'Unable to connect to the server. Please check your internet connection.',
    };
  }

  const apiErr = err as ApiError | undefined;
  if (!apiErr) {
    return {
      kind: 'unknown',
      message: 'Something went wrong. Please try again.',
    };
  }

  // 2. Request Timeout
  if (
    apiErr.isTimeout ||
    apiErr.code === 'ECONNABORTED' ||
    apiErr.code === 'ETIMEDOUT' ||
    (typeof apiErr.message === 'string' && /taking too long|timeout/i.test(apiErr.message))
  ) {
    return {
      kind: 'timeout',
      code: apiErr.code,
      message: 'The server is taking too long to respond. Please check your connection and try again.',
    };
  }

  // 3. HTTP status response received
  if (typeof apiErr.status === 'number' && apiErr.status > 0) {
    return {
      kind: 'http',
      status: apiErr.status,
      code: apiErr.code,
      message: apiErr.message || defaultHttpMsg,
      details: apiErr.details,
    };
  }

  // 4. Network error without HTTP status (server stopped, connection refused)
  return {
    kind: 'network',
    code: apiErr.code,
    message: 'Unable to connect to the server. Please check your connection and try again.',
  };
}
