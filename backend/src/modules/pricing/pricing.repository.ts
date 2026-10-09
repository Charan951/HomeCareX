import { Types } from 'mongoose';
import { PricingRuleModel } from '../../models/PricingRule';
import type { PutPricingBody } from './pricing.validation';

/** Exact, case-insensitive match for a city name ("Hyderabad" and "hyderabad" are the same city). */
const cityMatch = (city: string) => new RegExp(`^${city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

export const pricingRepository = {
  list(filter: { categoryId?: string; serviceId?: string; city?: string }) {
    const q: Record<string, unknown> = {};
    if (filter.categoryId) q.categoryId = filter.categoryId;
    if (filter.serviceId) q.serviceId = filter.serviceId;
    if (filter.city !== undefined) q.city = filter.city === '' ? '' : cityMatch(filter.city);
    return PricingRuleModel.find(q).sort({ updatedAt: -1 }).lean();
  },

  findById(id: string) {
    return PricingRuleModel.findById(id).lean();
  },

  remove(id: string) {
    return PricingRuleModel.findByIdAndDelete(id).lean();
  },

  /** Same scope as findExact, but the city is matched ignoring letter case. */
  findExactAnyCase(categoryId: string, serviceId: string | null, city: string) {
    return PricingRuleModel.findOne({ categoryId, serviceId, city: city === '' ? '' : cityMatch(city) }).lean();
  },

  findExact(categoryId: string, serviceId: string | null, city: string) {
    return PricingRuleModel.findOne({ categoryId, serviceId, city }).lean();
  },

  /** Replaces the rule for this scope, or creates it. */
  upsert(body: PutPricingBody, updatedBy: string) {
    const { categoryId, city } = body;
    const serviceId = body.serviceId ?? null;
    return PricingRuleModel.findOneAndUpdate(
      { categoryId, serviceId, city },
      {
        $set: {
          mode: body.mode,
          basePrice: body.basePrice,
          durationMinutes: body.durationMinutes,
          addOns: body.addOns,
          surgeWindows: body.surgeWindows,
          cancellationFee: body.cancellationFee,
          active: body.active,
          updatedBy,
        },
        $setOnInsert: { categoryId: new Types.ObjectId(categoryId), serviceId: serviceId ? new Types.ObjectId(serviceId) : null, city },
      },
      { upsert: true, new: true, runValidators: true },
    ).lean();
  },

  /** Active rules that could apply to a service, most specific first is decided by the caller. */
  findCandidates(categoryId: string, serviceId: string, city: string) {
    return PricingRuleModel.find({
      active: true,
      categoryId,
      $and: [
        { $or: [{ serviceId }, { serviceId: null }] },
        { $or: city ? [{ city: '' }, { city: cityMatch(city) }] : [{ city: '' }] },
      ],
    }).lean();
  },
};
