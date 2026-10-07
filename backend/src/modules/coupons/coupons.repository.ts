import { CouponModel } from '../../models/Coupon';
import { CouponUsageModel } from '../../models/CouponUsage';

export class CouponsRepository {
  async list(search?: string, active?: boolean) {
    const filter: Record<string, unknown> = {};

    if (search?.trim()) {
      filter.code = {
        $regex: search.trim(),
        $options: 'i',
      };
    }

    if (active !== undefined) {
      filter.active = active;
    }

    return CouponModel.find(filter)
      .sort({ createdAt: -1 })
      .lean();
  }

  async findById(id: string) {
    return CouponModel.findById(id);
  }

  async findByCode(code: string) {
    return CouponModel.findOne({
      code: code.trim().toUpperCase(),
    });
  }

  async create(data: Record<string, unknown>) {
    return CouponModel.create(data);
  }

  async update(id: string, data: Record<string, unknown>) {
    return CouponModel.findByIdAndUpdate(
      id,
      { $set: data },
      {
        new: true,
        runValidators: true,
      },
    );
  }

  async remove(id: string) {
    return CouponModel.findByIdAndDelete(id);
  }

  async countUsage(couponId: string, userId?: string) {
    const filter: Record<string, unknown> = { couponId };

    if (userId) {
      filter.userId = userId;
    }

    return CouponUsageModel.countDocuments(filter);
  }

  async recordUsage(
    couponId: string,
    userId: string,
    bookingId?: string,
  ) {
    return CouponUsageModel.create({
      couponId,
      userId,
      bookingId: bookingId || null,
    });
  }
}

export const couponsRepository = new CouponsRepository();
