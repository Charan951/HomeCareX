import bcrypt from 'bcryptjs';
import { UserModel } from '../../models/User';
import { HttpError } from '../auth/auth.types';
import { mailService } from '../../services/mail.service';
import type { CreatePartnerInput } from './partners.validation';

export class PartnersService {
  async create(input: CreatePartnerInput) {
    const duplicate = await UserModel.exists({ $or: [{ email: input.email }, { phone: input.phone }] });
    if (duplicate) {
      throw new HttpError(409, 'A user with this email or phone already exists', 'DUPLICATE_ACCOUNT');
    }

    const partner = await UserModel.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      designation: input.designation,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: 'partner', // login with this account opens /partner
    });

    // The account exists even if the mail fails; tell the admin so they can share credentials manually.
    let emailSent = true;
    try {
      await mailService.sendPartnerCredentials(
        { name: input.name, email: input.email, designation: input.designation },
        input.password,
      );
    } catch (err) {
      emailSent = false;
      console.error('Partner credentials email failed:', err);
    }

    return { partner: toDto(partner), emailSent };
  }

  async list() {
    const partners = await UserModel.find({ role: 'partner' }).sort({ createdAt: -1 }).limit(500);
    return partners.map(toDto);
  }

  async stats() {
    const [partners, customers] = await Promise.all([
      UserModel.countDocuments({ role: 'partner' }),
      UserModel.countDocuments({ role: 'customer' }),
    ]);
    return { partners, customers };
  }
}

function toDto(u: InstanceType<typeof UserModel>) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    gender: u.gender,
    designation: u.designation,
    status: u.status,
    createdAt: u.createdAt,
  };
}

export const partnersService = new PartnersService();
