import { z } from 'zod';

const GMAIL_USERNAME = /^(?=.*[a-z])(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9.]{6,30}$/;
const GMAIL_USERNAME_MESSAGE =
  'Email name must be 6-30 characters (letters, numbers, dots) and include at least one letter, e.g. john.doe25@gmail.com';

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email')
  .refine((v) => v.endsWith('@gmail.com'), 'Only @gmail.com addresses are allowed')
  .refine((v) => GMAIL_USERNAME.test(v.split('@')[0]), GMAIL_USERNAME_MESSAGE);

const nameField = z.string().trim().min(2, 'Name is required');
/** Checked against the Designation collection in the service, not a fixed list. */
const designationField = z.string().trim().min(1, 'Select a designation');
const phoneField = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');
const genderField = z.enum(['male', 'female', 'other'], { errorMap: () => ({ message: 'Select a gender' }) });

export const createPartnerSchema = z.object({
  name: nameField,
  email: emailField,
  designation: designationField,
  phone: phoneField,
  gender: genderField,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password needs an uppercase letter')
    .regex(/[0-9]/, 'Password needs a number'),
});

/** Edit form: send only what changed. `status` blocks/unblocks the login. */
export const updatePartnerSchema = z
  .object({
    name: nameField,
    email: emailField,
    designation: designationField,
    phone: phoneField,
    gender: genderField,
    status: z.enum(['active', 'blocked']),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export const partnersValidation = { createPartnerSchema, updatePartnerSchema };
