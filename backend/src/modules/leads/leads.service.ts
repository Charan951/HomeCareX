import { HttpError } from '../auth/auth.types';
import { LeadModel } from './leads.model';
import { verifyLeadCaptcha } from './recaptcha.service';
import { publicLeadSchema } from './leads.validation';

export type PublicLeadInput = {
  name: string;
  email?: string;
  phone: string;
  city: string;
  message?: string;
  skills?: string;
  source: 'contact' | 'partner';
  honeypot?: string;
  recaptchaToken?: string;
};

export class LeadsService {
  async createLead(input: PublicLeadInput, remoteIp?: string) {
    if (input.honeypot && input.honeypot.trim().length > 0) {
      return { success: true, message: 'Lead submitted successfully' };
    }

    const parsed = publicLeadSchema.safeParse({
      ...input,
      source: input.source,
    });

    if (!parsed.success) {
      throw new HttpError(400, 'Please check the highlighted fields.', 'VALIDATION_ERROR');
    }

    await verifyLeadCaptcha(parsed.data.recaptchaToken, remoteIp);

    const leadData = {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone.replace(/[\s()-]/g, ''),
      city: parsed.data.city,
      message: parsed.data.source === 'contact' ? parsed.data.message : undefined,
      skills: parsed.data.source === 'partner' ? parsed.data.skills : undefined,
      source: parsed.data.source,
      status: 'new',
    };

    await LeadModel.create(leadData);

    return {
      success: true,
      message: 'Lead submitted successfully',
    };
  }
}
