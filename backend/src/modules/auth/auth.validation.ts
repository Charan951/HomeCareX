import { z } from 'zod';
import { HttpError } from './auth.types';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  phone: z
    .string()
    .trim()
    .transform((val) => {
      const cleaned = val.replace(/[\s()-]/g, '');
      if (cleaned.startsWith('+91')) return cleaned.slice(3);
      if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.slice(2);
      return cleaned;
    })
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
      message: 'Enter a valid 10-digit mobile number',
    })
    .optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[0-9]/, 'Password needs a number'),
  confirmPassword: z.string().optional(),
  referralCode: z.string().trim().optional(),
  role: z.enum(['customer', 'partner']).default('customer'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[0-9]/, 'Password needs a number'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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
