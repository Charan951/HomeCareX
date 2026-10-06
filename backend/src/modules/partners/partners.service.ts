import bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

import BookingModel from '../../models/Booking';
import { NotificationModel } from '../../models/Notification';
import PartnerModel from '../../models/Partner';
import { UserModel } from '../../models/User';

import { Errors } from '../../utils/errors';
import { HttpError } from '../auth/auth.types';
import { designationsService } from '../designations/designations.service';
import { mailService } from '../../services/mail.service';

import type {
  CreatePartnerInput,
  UpdatePartnerInput,
} from './partners.validation';

/**
 * ---------------------------------------------------------
 * CANONICAL DESIGNATION
 * ---------------------------------------------------------
 */
async function canonicalDesignation(
  name: string,
): Promise<string> {
  const found =
    await designationsService.canonical(name);

  if (!found) {
    throw Errors.validation([
      {
        field: 'designation',
        message:
          'Select a designation from the list',
      },
    ]);
  }

  return found;
}

/**
 * ---------------------------------------------------------
 * FIND PARTNER USER
 * ---------------------------------------------------------
 */
async function findPartnerUser(
  id: string,
) {
  const user =
    await UserModel.findOne({
      _id: id,
      role: 'partner',
    });

  if (!user) {
    throw new HttpError(
      404,
      'Partner not found',
      'PARTNER_NOT_FOUND',
    );
  }

  return user;
}

/**
 * ---------------------------------------------------------
 * ENSURE PARTNER PROFILE
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 * Mongoose gives us an ObjectId for _id.
 *
 * This method therefore accepts either:
 *
 * - string
 * - ObjectId
 *
 * This fixes the TypeScript errors where
 * user._id / partner._id were being passed here.
 */
async function ensurePartnerProfile(
  userId: string | Types.ObjectId,
) {
  /**
   * Always normalize the value to a real ObjectId.
   */
  const normalizedUserId =
    userId instanceof Types.ObjectId
      ? userId
      : new Types.ObjectId(userId);

  /**
   * Create the Partner profile if it does not exist.
   *
   * If it already exists, leave it unchanged.
   */
  return PartnerModel.findOneAndUpdate(
    {
      userId: normalizedUserId,
    },
    {
      $setOnInsert: {
        userId: normalizedUserId,

        categories: [],

        skills: [],

        serviceRadiusKm: 10,

        ratingAvg: 0,

        ratingCount: 0,

        stats: {
          offersReceived: 0,
          offersAccepted: 0,
          jobsAssigned: 0,
          jobsCompleted: 0,
        },

        kyc: {
          status: 'not_started',
          documents: [],
        },

        trainingCompleted: false,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );
}

/**
 * ---------------------------------------------------------
 * PARTNERS SERVICE
 * ---------------------------------------------------------
 */
export class PartnersService {
  /**
   * -------------------------------------------------------
   * CREATE PARTNER
   * -------------------------------------------------------
   */
  async create(
    input: CreatePartnerInput,
  ) {
    /**
     * Check duplicate email/phone.
     */
    const duplicate =
      await UserModel.exists({
        $or: [
          {
            email: input.email,
          },
          {
            phone: input.phone,
          },
        ],
      });

    if (duplicate) {
      throw new HttpError(
        409,
        'A user with this email or phone already exists',
        'DUPLICATE_ACCOUNT',
      );
    }

    /**
     * Validate designation.
     */
    const designation =
      await canonicalDesignation(
        input.designation,
      );

    /**
     * Create partner User.
     */
    const partner =
      await UserModel.create({
        name: input.name,

        email: input.email,

        phone: input.phone,

        gender: input.gender,

        designation,

        passwordHash:
          await bcrypt.hash(
            input.password,
            12,
          ),

        role: 'partner',
      });

    /**
     * Create Partner profile.
     *
     * If profile creation fails, remove the newly
     * created User so we don't leave an incomplete
     * partner account.
     */
    try {
      await ensurePartnerProfile(
        partner._id,
      );
    } catch (error) {
      await partner.deleteOne();

      throw error;
    }

    /**
     * Send partner credentials email.
     */
    let emailSent = true;

    try {
      await mailService.sendPartnerCredentials(
        {
          name: input.name,
          email: input.email,
          designation,
        },
        input.password,
      );
    } catch (err) {
      emailSent = false;

      console.error(
        'Partner credentials email failed:',
        err,
      );
    }

    return {
      partner: toDto(partner),
      emailSent,
    };
  }

  /**
   * -------------------------------------------------------
   * LIST PARTNERS
   * -------------------------------------------------------
   */
  async list() {
    const partners =
      await UserModel.find({
        role: 'partner',
      })
        .sort({
          createdAt: -1,
        })
        .limit(500);

    /**
     * Repair old partner Users that don't yet have
     * a Partner profile.
     */
    for (const partner of partners) {
      await ensurePartnerProfile(
        partner._id,
      );
    }

    return partners.map(toDto);
  }

  /**
   * -------------------------------------------------------
   * UPDATE PARTNER
   * -------------------------------------------------------
   */
  async update(
    id: string,
    input: UpdatePartnerInput,
  ) {
    const user =
      await findPartnerUser(id);

    /**
     * Make sure the partner profile exists.
     */
    await ensurePartnerProfile(
      user._id,
    );

    /**
     * -----------------------------------------------------
     * EMAIL
     * -----------------------------------------------------
     */
    if (
      input.email !== undefined &&
      input.email !== user.email
    ) {
      const duplicate =
        await UserModel.exists({
          email: input.email,
          _id: {
            $ne: user._id,
          },
        });

      if (duplicate) {
        throw new HttpError(
          409,
          'Another user already uses this email',
          'DUPLICATE_ACCOUNT',
        );
      }

      user.email =
        input.email;
    }

    /**
     * -----------------------------------------------------
     * PHONE
     * -----------------------------------------------------
     */
    if (
      input.phone !== undefined &&
      input.phone !== user.phone
    ) {
      const duplicate =
        await UserModel.exists({
          phone: input.phone,
          _id: {
            $ne: user._id,
          },
        });

      if (duplicate) {
        throw new HttpError(
          409,
          'Another user already uses this phone number',
          'DUPLICATE_ACCOUNT',
        );
      }

      user.phone =
        input.phone;
    }

    /**
     * -----------------------------------------------------
     * BASIC DETAILS
     * -----------------------------------------------------
     */
    if (
      input.name !== undefined
    ) {
      user.name =
        input.name;
    }

    if (
      input.gender !== undefined
    ) {
      user.gender =
        input.gender;
    }

    if (
      input.designation !== undefined
    ) {
      user.designation =
        await canonicalDesignation(
          input.designation,
        );
    }

    /**
     * -----------------------------------------------------
     * ACCOUNT STATUS
     * -----------------------------------------------------
     */
    if (
      input.status !== undefined &&
      input.status !== user.status
    ) {
      user.status =
        input.status;

      /**
       * Immediately invalidate existing sessions
       * when the partner is blocked.
       */
      if (
        input.status === 'blocked'
      ) {
        user.tokenVersion =
          (user.tokenVersion ?? 0) + 1;
      }
    }

    await user.save();

    return toDto(user);
  }

  /**
   * -------------------------------------------------------
   * REMOVE PARTNER
   * -------------------------------------------------------
   */
  async remove(
    id: string,
  ) {
    const user =
      await findPartnerUser(id);

    const profile =
      await PartnerModel.findOne(
        {
          userId: user._id,
        },
        '_id',
      ).lean();

    /**
     * Don't delete partners with booking history.
     */
    if (
      profile &&
      (await BookingModel.exists({
        partnerId:
          profile._id,
      }))
    ) {
      throw new HttpError(
        409,
        'This partner has booking history and cannot be deleted. Block the account instead.',
        'PARTNER_HAS_BOOKINGS',
      );
    }

    await Promise.all([
      profile
        ? PartnerModel.deleteOne({
            _id: profile._id,
          })
        : Promise.resolve(),

      NotificationModel.deleteMany({
        userId: user._id,
      }),
    ]);

    await user.deleteOne();
  }

  /**
   * -------------------------------------------------------
   * STATS
   * -------------------------------------------------------
   */
  async stats() {
    const [
      partners,
      customers,
    ] = await Promise.all([
      UserModel.countDocuments({
        role: 'partner',
      }),

      UserModel.countDocuments({
        role: 'customer',
      }),
    ]);

    return {
      partners,
      customers,
    };
  }
}

/**
 * ---------------------------------------------------------
 * PARTNER DTO
 * ---------------------------------------------------------
 */
function toDto(
  u: InstanceType<typeof UserModel>,
) {
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

/**
 * ---------------------------------------------------------
 * EXPORT SERVICE
 * ---------------------------------------------------------
 */
export const partnersService =
  new PartnersService();