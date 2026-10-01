import { ERROR_CODES, type ErrorCode } from '../constants/ErrorCodes';
import { HttpError } from '../modules/auth/auth.types';

type Details = { field: string; message: string }[];

export function httpError(status: number, code: ErrorCode, message: string, details?: Details): HttpError {
  const err = new HttpError(status, message, code);
  if (details) err.details = details;
  return err;
}

export const Errors = {
  badRequest: (message: string, details?: Details) => httpError(400, ERROR_CODES.BAD_REQUEST, message, details),
  validation: (details: Details) => httpError(400, ERROR_CODES.VALIDATION_ERROR, 'Some fields are invalid', details),
  unauthorized: (message = 'Authentication required') => httpError(401, ERROR_CODES.NO_ACCESS_TOKEN, message),
  forbidden: (message = 'You do not have access to this resource') => httpError(403, ERROR_CODES.FORBIDDEN, message),
  missingPermission: (permission: string) =>
    httpError(403, ERROR_CODES.MISSING_PERMISSION, `Missing permission: ${permission}`),
  notOwner: () => httpError(403, ERROR_CODES.RESOURCE_FORBIDDEN, 'You can only access your own data'),
  notFound: (code: ErrorCode, message: string) => httpError(404, code, message),
  conflict: (code: ErrorCode, message: string) => httpError(409, code, message),
};