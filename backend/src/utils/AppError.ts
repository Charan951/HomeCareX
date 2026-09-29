/**
 * Operational error with an HTTP status and a stable, machine-readable `code`.
 * The error middleware turns it into `{ success:false, error:{ code, message, details? } }`.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
