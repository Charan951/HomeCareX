import { z } from 'zod';

export const DESIGNATIONS = [
  'Plumber',
  'Electrician',
  'Cleaner',
  'Painter',
  'Appliance Repair',
  'Maintenance',
] as const;

const GMAIL_USERNAME = /^(?=.*[a-z])(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9.]{6,30}$/;
const GMAIL_USERNAME_MESSAGE =
  'Email name must be 6-30 characters (letters, numbers, dots) and include at least one letter, e.g. john.doe25@gmail.com';

  export const createPartnerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
    email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email')
    .refine((v) => v.endsWith('@gmail.com'), 'Only @gmail.com addresses are allowed')
    .refine((v) => GMAIL_USERNAME.test(v.split('@')[0]), GMAIL_USERNAME_MESSAGE),
  designation: z.enum(DESIGNATIONS, { errorMap: () => ({ message: 'Select a designation' }) }),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
  gender: z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Select a gender' }) }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[0-9]/, 'Password needs a number'),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export const partnersValidation = { createPartnerSchema };
