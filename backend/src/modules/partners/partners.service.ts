import bcrypt from 'bcryptjs';
import BookingModel from '../../models/Booking';
import { NotificationModel } from '../../models/Notification';
import PartnerModel from '../../models/Partner';
import { UserModel } from '../../models/User';
import { Errors } from '../../utils/errors';
import { HttpError } from '../auth/auth.types';
import { designationsService } from '../designations/designations.service';
import { mailService } from '../../services/mail.service';
import type { CreatePartnerInput, UpdatePartnerInput } from './partners.validation';

async function canonicalDesignation(name: string): Promise<string> {
  const found = await designationsService.canonical(name);
  if (!found) throw Errors.validation([{ field: 'designation', message: 'Select a designation from the list' }]);
  return found;
}

async function findPartnerUser(id: string) {
  const user = await UserModel.findOne({ _id: id, role: 'partner' });
  if (!user) throw new HttpError(404, 'Partner not found', 'PARTNER_NOT_FOUND');
  return user;
}

export class PartnersService {
  async create(input: CreatePartnerInput) {
    const duplicate = await UserModel.exists({ $or: [{ email: input.email }, { phone: input.phone }] });
    if (duplicate) {
      throw new HttpError(409, 'A user with this email or phone already exists', 'DUPLICATE_ACCOUNT');
    }
    const designation = await canonicalDesignation(input.designation);

    const partner = await UserModel.create({
      name: input.name,
      email: input.email,
      phone: input.phone,
      gender: input.gender,
      designation,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: 'partner', // login with this account opens /partner
    });

    // The account exists even if the mail fails; tell the admin so they can share credentials manually.
    let emailSent = true;
    try {
      await mailService.sendPartnerCredentials({ name: input.name, email: input.email, designation }, input.password);
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

  async update(id: string, input: UpdatePartnerInput) {
    const user = await findPartnerUser(id);

    if (input.email !== undefined && input.email !== user.email) {
      if (await UserModel.exists({ email: input.email, _id: { $ne: user._id } })) {
        throw new HttpError(409, 'Another user already uses this email', 'DUPLICATE_ACCOUNT');
      }
      user.email = input.email;
    }
    if (input.phone !== undefined && input.phone !== user.phone) {
      if (await UserModel.exists({ phone: input.phone, _id: { $ne: user._id } })) {
        throw new HttpError(409, 'Another user already uses this phone number', 'DUPLICATE_ACCOUNT');
      }
      user.phone = input.phone;
    }
    if (input.name !== undefined) user.name = input.name;
    if (input.gender !== undefined) user.gender = input.gender;
    if (input.designation !== undefined) user.designation = await canonicalDesignation(input.designation);

    if (input.status !== undefined && input.status !== user.status) {
      user.status = input.status;
      // Blocking must cut off existing sessions immediately, not at the next token expiry.
      if (input.status === 'blocked') user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    }

    await user.save();
    return toDto(user);
  }

  /**
   * Hard delete. Refused when the partner has bookings, because those records point at the profile;
   * block the account instead in that case.
   */
  async remove(id: string) {
    const user = await findPartnerUser(id);
    const profile = await PartnerModel.findOne({ userId: user._id }, '_id').lean();
    if (profile && (await BookingModel.exists({ partnerId: profile._id }))) {
      throw new HttpError(409, 'This partner has booking history and cannot be deleted. Block the account instead.', 'PARTNER_HAS_BOOKINGS');
    }
    await Promise.all([
      profile ? PartnerModel.deleteOne({ _id: profile._id }) : Promise.resolve(),
      NotificationModel.deleteMany({ userId: user._id }),
    ]);
    await user.deleteOne();
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
