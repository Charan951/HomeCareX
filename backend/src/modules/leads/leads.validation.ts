import { z } from 'zod';

export const contactLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((value) => value.toLowerCase().endsWith('@gmail.com'), {
      message: 'Please use a Gmail address ending in @gmail.com',
    }),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .refine((value) => /^(?:\+91|91)?[6-9]\d{9}$/.test(value.replace(/[\s()-]/g, '')), {
      message: 'Please enter a valid Indian mobile number',
    }),
  city: z.string().trim().min(1, 'City is required'),
  message: z
    .string()
    .trim()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must be 1000 characters or fewer'),
  source: z.literal('contact'),
  honeypot: z.string().trim().optional(),
  recaptchaToken: z.string().max(4096).optional(),
});

export const partnerLeadSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone is required')
    .refine((value) => /^(?:\+91|91)?[6-9]\d{9}$/.test(value.replace(/[\s()-]/g, '')), {
      message: 'Please enter a valid Indian mobile number',
    }),
  city: z.string().trim().min(1, 'City is required'),
  skills: z.string().trim().min(1, 'Skills are required'),
  source: z.literal('partner'),
  honeypot: z.string().trim().optional(),
  recaptchaToken: z.string().max(4096).optional(),
});

export const publicLeadSchema = z.union([contactLeadSchema, partnerLeadSchema]);
