import React, { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCreateLead } from '@/features/public/leads';

const inputClassName =
  'min-h-12 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition-colors duration-150 placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 aria-[invalid=true]:border-red-500 aria-[invalid=true]:focus:ring-red-100';

const partnerInterestSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  phone: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .refine((value) => /^(?:\+91|91)?[6-9]\d{9}$/.test(value.replace(/[\s()-]/g, '')), {
      message: 'Please enter a valid Indian mobile number',
    }),
  city: z.string().trim().min(1, 'City is required'),
  skills: z.string().trim().min(1, 'Skills are required'),
  honeypot: z.string().optional(),
});

export type PartnerInterestFormValues = z.infer<typeof partnerInterestSchema>;

const PartnerInterestForm: React.FC = () => {
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const mutation = useCreateLead();

  const defaultValues = useMemo<PartnerInterestFormValues>(() => ({
    name: '',
    phone: '',
    city: '',
    skills: '',
    honeypot: '',
  }), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PartnerInterestFormValues>({
    resolver: zodResolver(partnerInterestSchema),
    defaultValues,
  });

  const onSubmit = async (values: PartnerInterestFormValues) => {
    if (values.honeypot && values.honeypot.trim().length > 0) {
      reset(defaultValues);
      return;
    }

    setFeedback(null);

    try {
      await mutation.mutateAsync({
        name: values.name,
        phone: values.phone.replace(/[\s()-]/g, ''),
        city: values.city,
        skills: values.skills,
        source: 'partner',
      });

      setFeedback({
        type: 'success',
        text: 'Thanks! Our team will get in touch with you.',
      });
      reset(defaultValues);
    } catch (error) {
      setFeedback({
        type: 'error',
        text:
          error instanceof Error && error.message ? error.message : 'Please check the highlighted fields.',
      });
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-blue-700">Partner enquiry</p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">Share your interest</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">Tell us about your skills and location.</p>
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
        <div>
          <label htmlFor="partner-name" className="mb-2 block text-sm font-medium text-slate-700">
            Name <span aria-hidden="true" className="text-blue-700">*</span>
          </label>
          <input
            id="partner-name"
            type="text"
            autoComplete="name"
            {...register('name')}
            aria-required="true"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'partner-name-error' : undefined}
            className={inputClassName}
            placeholder="Your full name"
          />
          {errors.name && <p id="partner-name-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.name.message}</p>}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="partner-phone" className="mb-2 block text-sm font-medium text-slate-700">
              Phone <span aria-hidden="true" className="text-blue-700">*</span>
            </label>
            <input
              id="partner-phone"
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              aria-required="true"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'partner-phone-error' : undefined}
              className={inputClassName}
              placeholder="+91 98765 43210"
            />
            {errors.phone && <p id="partner-phone-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.phone.message}</p>}
          </div>

          <div>
            <label htmlFor="partner-city" className="mb-2 block text-sm font-medium text-slate-700">
              City <span aria-hidden="true" className="text-blue-700">*</span>
            </label>
            <input
              id="partner-city"
              type="text"
              autoComplete="address-level2"
              {...register('city')}
              aria-required="true"
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? 'partner-city-error' : undefined}
              className={inputClassName}
              placeholder="Your city"
            />
            {errors.city && <p id="partner-city-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.city.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="partner-skills" className="mb-2 block text-sm font-medium text-slate-700">
            Skills <span aria-hidden="true" className="text-blue-700">*</span>
          </label>
          <textarea
            id="partner-skills"
            rows={4}
            {...register('skills')}
            aria-required="true"
            aria-invalid={Boolean(errors.skills)}
            aria-describedby={errors.skills ? 'partner-skills-error' : undefined}
            className={`${inputClassName} min-h-28 resize-y`}
            placeholder="e.g. cleaning, plumbing, elder care"
          />
          {errors.skills && <p id="partner-skills-error" role="alert" className="mt-1.5 text-sm text-red-700">{errors.skills.message}</p>}
        </div>

        <div className="sr-only" aria-hidden="true">
          <label htmlFor="partner-honeypot">Leave this blank</label>
          <input id="partner-honeypot" tabIndex={-1} autoComplete="off" {...register('honeypot')} />
        </div>

        <button
          type="submit"
          disabled={isSubmitting || mutation.isPending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {mutation.isPending || isSubmitting ? 'Submitting...' : <>Submit interest <ArrowRight aria-hidden="true" size={17} /></>}
        </button>
      </form>
    </div>
  );
};

export default PartnerInterestForm;
