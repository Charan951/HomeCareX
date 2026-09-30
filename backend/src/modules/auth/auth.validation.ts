import { z } from 'zod';
import { HttpError } from './auth.types';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[0-9]/, 'Password needs a number'),
  role: z.enum(['customer', 'partner']).default('customer'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Parses a body or throws a 400 with per-field details. */
export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const err = new HttpError(400, result.error.issues[0]?.message ?? 'Invalid request', 'VALIDATION_ERROR');
    err.details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    throw err;
  }
  return result.data;
}
