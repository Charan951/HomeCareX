import React, { useCallback, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import RecaptchaNotice from '@/components/public/RecaptchaNotice';
import { useCreateLead } from '@/features/public/leads';
import { isRecaptchaConfigured } from '@/features/public/recaptcha';

const inputClassName =
  'min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-colors duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-100';

const contactLeadSchema = z.object({
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
    .min(1, 'Phone number is required')
    .refine((value) => /^(?:\+91|91)?[6-9]\d{9}$/.test(value.replace(/[\s()-]/g, '')), {
      message: 'Please enter a valid Indian mobile number',
    }),
  city: z.string().trim().min(1, 'City is required'),
  message: z
    .string()
    .trim()
    .min(20, 'Message must be at least 20 characters')
    .max(1000, 'Message must be under 1000 characters'),
  honeypot: z.string().optional(),
});

export type ContactLeadFormValues = z.infer<typeof contactLeadSchema>;

const ContactForm: React.FC = () => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const mutation = useCreateLead();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const handleCaptchaToken = useCallback((token: string | null) => setCaptchaToken(token), []);
  const captchaMissing = isRecaptchaConfigured && !captchaToken;

  const defaultValues = useMemo<ContactLeadFormValues>(() => ({
    name: '',
    email: '',
    phone: '',
    city: '',
    message: '',
    honeypot: '',
  }), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactLeadFormValues>({
    resolver: zodResolver(contactLeadSchema),
    defaultValues,
  });

  const onSubmit = async (values: ContactLeadFormValues) => {
    if (values.honeypot && values.honeypot.trim().length > 0) {
      reset(defaultValues);
      return;
    }

    setFeedback(null);

    if (captchaMissing) {
      setFeedback({ type: 'error', text: 'Please complete the security check.' });
      return;
    }

    try {
      await mutation.mutateAsync({
        name: values.name,
        email: values.email,
        phone: values.phone.replace(/[\s()-]/g, ''),
        city: values.city,
        message: values.message,
        source: 'contact',
        ...(captchaToken ? { recaptchaToken: captchaToken } : {}),
      });

      setFeedback({
        type: 'success',
        text: 'Thanks! Your message has been submitted successfully.',
      });
      reset(defaultValues);
      setCaptchaResetKey((k) => k + 1);
    } catch (error) {
      setCaptchaResetKey((k) => k + 1);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Please check the highlighted fields.';

      setFeedback({
        type: 'error',
        text: message,
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7 lg:p-8">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-700">Contact our team</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">
          Send us a message
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Share a few details and we’ll help with your enquiry.
        </p>
        <p className="mt-3 text-xs text-slate-500">
          <span aria-hidden="true" className="font-semibold text-blue-700">*</span> Required fields
        </p>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'success' ? 'status' : 'alert'}
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
          <div className="md:col-span-1">
            <label htmlFor="contact-name" className="mb-2 block text-sm font-medium text-slate-700">
              Name <span aria-hidden="true" className="text-blue-700">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              autoComplete="name"
              {...register('name')}
              aria-required="true"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
              className={inputClassName}
              placeholder="Your full name"
            />
            {errors.name && <p id="contact-name-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.name.message}</p>}
          </div>

          <div>
            <label htmlFor="contact-email" className="mb-2 block text-sm font-medium text-slate-700">
              Email <span aria-hidden="true" className="text-blue-700">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              {...register('email')}
              aria-required="true"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              className={inputClassName}
              placeholder="you@gmail.com"
            />
            {errors.email && <p id="contact-email-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="contact-phone" className="mb-2 block text-sm font-medium text-slate-700">
              Phone <span aria-hidden="true" className="text-blue-700">*</span>
            </label>
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              aria-required="true"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
              className={inputClassName}
              placeholder="+91 98765 43210"
            />
            {errors.phone && <p id="contact-phone-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="contact-city" className="mb-2 block text-sm font-medium text-slate-700">
              City <span aria-hidden="true" className="text-blue-700">*</span>
            </label>
            <input
              id="contact-city"
              type="text"
              autoComplete="address-level2"
              {...register('city')}
              aria-required="true"
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? 'contact-city-error' : undefined}
              className={inputClassName}
              placeholder="Your city"
            />
            {errors.city && <p id="contact-city-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.city.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-medium text-slate-700">
            Message <span aria-hidden="true" className="text-blue-700">*</span>
          </label>
          <textarea
            id="contact-message"
            rows={6}
            {...register('message')}
            aria-required="true"
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? 'contact-message-error' : 'contact-message-hint'}
            className={`${inputClassName} min-h-32 resize-y`}
            placeholder="Tell us how we can help..."
          />
          {errors.message ? (
            <p id="contact-message-error" role="alert" className="mt-1.5 text-sm text-red-700">
              {errors.message.message}
            </p>
          ) : (
            <p id="contact-message-hint" className="mt-1.5 text-xs text-slate-500">
              Please include at least 20 characters.
            </p>
          )}
        </div>

        <div className="sr-only" aria-hidden="true">
          <label htmlFor="contact-honeypot">Leave this blank</label>
          <input id="contact-honeypot" tabIndex={-1} autoComplete="off" {...register('honeypot')} />
        </div>

        <RecaptchaNotice onTokenChange={handleCaptchaToken} resetKey={captchaResetKey} />

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending || captchaMissing}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {mutation.isPending || isSubmitting ? 'Sending...' : <>Send message <ArrowRight aria-hidden="true" size={17} /></>}
        </button>
      </form>
    </div>
  );
};

export default ContactForm;
