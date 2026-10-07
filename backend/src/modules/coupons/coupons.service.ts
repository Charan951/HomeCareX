import { Types } from 'mongoose';
import { CouponModel } from '../../models/Coupon';
import { ServiceModel } from '../../models/Service';
import { HttpError } from '../auth/auth.types';
import {
  couponCreateSchema,
  couponUpdateSchema,
} from './coupons.validation';
import { couponsRepository } from './coupons.repository';
import type {
  CouponDto,
  CouponValidateInput,
  CouponValidateResult,
} from './coupons.types';

interface CouponDocumentLike {
  _id: Types.ObjectId;
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  maxDiscount?: number | null;
  minOrder: number;
  startAt: Date;
  endAt: Date;
  totalLimit?: number | null;
  perUserLimit?: number | null;
  usedCount: number;
  categoryIds: Types.ObjectId[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const toDto = (coupon: CouponDocumentLike): CouponDto => ({
  id: coupon._id.toString(),
  code: coupon.code,
  type: coupon.type,
  value: coupon.value,
  maxDiscount: coupon.maxDiscount ?? null,
  minOrder: coupon.minOrder ?? 0,
  startAt: coupon.startAt.toISOString(),
  endAt: coupon.endAt.toISOString(),
  totalLimit: coupon.totalLimit ?? null,
  perUserLimit: coupon.perUserLimit ?? null,
  usedCount: coupon.usedCount ?? 0,
  categoryIds: (coupon.categoryIds ?? []).map((id) => id.toString()),
  active: coupon.active,
  createdAt: coupon.createdAt.toISOString(),
  updatedAt: coupon.updatedAt.toISOString(),
});

export class CouponsService {
  async list(
    search?: string,
    active?: boolean,
  ): Promise<CouponDto[]> {
    const coupons = await couponsRepository.list(search, active);

    return coupons.map((coupon) =>
      toDto(coupon as unknown as CouponDocumentLike),
    );
  }

  async getById(id: string): Promise<CouponDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(404, 'Coupon not found', 'NOT_FOUND');
    }

    const coupon = await couponsRepository.findById(id);

    if (!coupon) {
      throw new HttpError(404, 'Coupon not found', 'NOT_FOUND');
    }

    return toDto(coupon as unknown as CouponDocumentLike);
  }

  async create(input: unknown): Promise<CouponDto> {
    const parsed = couponCreateSchema.safeParse(input);

    if (!parsed.success) {
      const error = new HttpError(
        422,
        'Invalid coupon data',
        'VALIDATION_ERROR',
      );

      error.details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw error;
    }

    const data = parsed.data;

    const existing = await couponsRepository.findByCode(data.code);

    if (existing) {
      throw new HttpError(
        409,
        'Coupon code already exists',
        'COUPON_DUPLICATE',
      );
    }

    const coupon = await couponsRepository.create({
      ...data,
      code: data.code.toUpperCase(),
    });

    return toDto(coupon as unknown as CouponDocumentLike);
  }

  async update(
    id: string,
    input: unknown,
  ): Promise<CouponDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(404, 'Coupon not found', 'NOT_FOUND');
    }

    const parsed = couponUpdateSchema.safeParse(input);

    if (!parsed.success) {
      const error = new HttpError(
        422,
        'Invalid coupon data',
        'VALIDATION_ERROR',
      );

      error.details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw error;
    }

    const data = parsed.data;

    if (data.code) {
      const existing = await couponsRepository.findByCode(data.code);

      if (
        existing &&
        existing._id.toString() !== id
      ) {
        throw new HttpError(
          409,
          'Coupon code already exists',
          'COUPON_DUPLICATE',
        );
      }
    }

    const coupon = await couponsRepository.update(id, {
      ...data,
      ...(data.code
        ? { code: data.code.toUpperCase() }
        : {}),
    });

    if (!coupon) {
      throw new HttpError(
        404,
        'Coupon not found',
        'NOT_FOUND',
      );
    }

    return toDto(coupon as unknown as CouponDocumentLike);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(404, 'Coupon not found', 'NOT_FOUND');
    }

    const coupon = await couponsRepository.remove(id);

    if (!coupon) {
      throw new HttpError(
        404,
        'Coupon not found',
        'NOT_FOUND',
      );
    }
  }

  async validate(
    input: CouponValidateInput,
    userId: string,
  ): Promise<CouponValidateResult> {
    const code = input.couponCode
      .trim()
      .toUpperCase();

    if (!code) {
      throw new HttpError(
        422,
        'Coupon code is required',
        'COUPON_INVALID',
      );
    }

    const coupon = await couponsRepository.findByCode(code);

    if (!coupon) {
      throw new HttpError(
        422,
        'That coupon code is not valid',
        'COUPON_INVALID',
      );
    }

    if (!coupon.active) {
      throw new HttpError(
        422,
        'This coupon is inactive',
        'COUPON_INACTIVE',
      );
    }

    const now = new Date();

    if (now < coupon.startAt) {
      throw new HttpError(
        422,
        'This coupon has not started yet',
        'COUPON_NOT_STARTED',
      );
    }

    if (now > coupon.endAt) {
      throw new HttpError(
        422,
        'This coupon has expired',
        'COUPON_EXPIRED',
      );
    }

    if (
      coupon.totalLimit !== null &&
      coupon.totalLimit !== undefined &&
      coupon.usedCount >= coupon.totalLimit
    ) {
      throw new HttpError(
        422,
        'This coupon has reached its usage limit',
        'COUPON_USAGE_LIMIT',
      );
    }

    const userUsage =
      await couponsRepository.countUsage(
        coupon._id.toString(),
        userId,
      );

    if (
      coupon.perUserLimit !== null &&
      coupon.perUserLimit !== undefined &&
      userUsage >= coupon.perUserLimit
    ) {
      throw new HttpError(
        422,
        'You have reached the usage limit for this coupon',
        'COUPON_PER_USER_LIMIT',
      );
    }

    if (!Types.ObjectId.isValid(input.serviceId)) {
      throw new HttpError(
        422,
        'That service is not valid',
        'COUPON_INVALID',
      );
    }

    const service = await ServiceModel.findById(
      input.serviceId,
    );

    if (!service || !service.active) {
      throw new HttpError(
        422,
        'That service is not available',
        'COUPON_INVALID',
      );
    }

    if (
      coupon.categoryIds.length > 0 &&
      !coupon.categoryIds.some(
        (categoryId) =>
          categoryId.toString() ===
          service.categoryId.toString(),
      )
    ) {
      throw new HttpError(
        422,
        'This coupon is not applicable to this service',
        'COUPON_NOT_APPLICABLE',
      );
    }

    const quantity = Math.max(
      1,
      input.quantity || 1,
    );

    let orderValue =
      service.basePrice * quantity;

    for (const addOnInput of input.addOns ?? []) {
      const addOn = service.addOns.find(
        (item) =>
          item._id.toString() ===
          addOnInput.addOnId,
      );

      if (addOn) {
        orderValue +=
          addOn.price *
          Math.max(
            1,
            addOnInput.quantity || 1,
          );
      }
    }

    if (orderValue < coupon.minOrder) {
      const error = new HttpError(
        422,
        `Minimum order value is ₹${coupon.minOrder}`,
        'COUPON_MIN_ORDER',
      );

      error.details = [
        {
          field: 'minOrder',
          message: String(coupon.minOrder),
        },
      ];

      throw error;
    }

    let discount =
      coupon.type === 'PERCENT'
        ? Math.round(
            (orderValue * coupon.value) / 100,
          )
        : coupon.value;

    if (
      coupon.maxDiscount !== null &&
      coupon.maxDiscount !== undefined
    ) {
      discount = Math.min(
        discount,
        coupon.maxDiscount,
      );
    }

    discount = Math.min(
      discount,
      orderValue,
    );

    return {
      code,
      discount,
    };
  }

  async listAvailable(
    input: Omit<
      CouponValidateInput,
      'couponCode'
    >,
    userId: string,
  ): Promise<
    {
      code: string;
      title: string;
      description: string;
      eligible: boolean;
      reason?: {
        code: string;
        minOrder?: number;
      };
    }[]
  > {
    const coupons =
      await CouponModel.find({
        active: true,
      }).sort({
        createdAt: -1,
      });

    const results: {
      code: string;
      title: string;
      description: string;
      eligible: boolean;
      reason?: {
        code: string;
        minOrder?: number;
      };
    }[] = [];

    for (const coupon of coupons) {
      const title =
        coupon.type === 'PERCENT'
          ? `${coupon.value}% off`
          : `Flat ₹${coupon.value} off`;

      const description =
        coupon.minOrder > 0
          ? `On orders of ₹${coupon.minOrder} and above`
          : 'Available on eligible services';

      try {
        await this.validate(
          {
            ...input,
            couponCode: coupon.code,
          },
          userId,
        );

        results.push({
          code: coupon.code,
          title,
          description,
          eligible: true,
        });
      } catch (error) {
        const err = error as HttpError;

        results.push({
          code: coupon.code,
          title,
          description,
          eligible: false,
          reason: {
            code:
              err.code ??
              'COUPON_INVALID',
            ...(err.details?.[0]?.message
              ? {
                  minOrder: Number(
                    err.details[0].message,
                  ),
                }
              : {}),
          },
        });
      }
    }

    return results;
  }
}

export const couponsService =
  new CouponsService();

