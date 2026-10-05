import { Types } from 'mongoose';
import { CategoryModel } from '../../models/Category';
import { ServiceModel, type ServiceAvailability } from '../../models/Service';
import type { BuiltServiceQuery } from './catalog.query';

export interface CategoryRow {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface CategoryStats {
  count: number;
  fromPrice: number;
  bookings: number;
}

export interface ServiceRow {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  categoryId: Types.ObjectId;
  basePrice: number;
  durationMinutes: number;
  ratingAvg?: number;
  ratingCount?: number;
  availability?: ServiceAvailability;
  addOns?: { _id: Types.ObjectId; name: string; price: number }[];
}

const CATEGORY_FIELDS = 'name slug description icon sortOrder';
const LIST_FIELDS = 'slug name description icon categoryId basePrice durationMinutes ratingAvg ratingCount availability';

/** Only layer that talks to Mongo. Tests swap these methods for in-memory versions. */
export const catalogRepository = {
  activeCategories(): Promise<CategoryRow[]> {
    return CategoryModel.find({ isActive: true }, CATEGORY_FIELDS).sort({ sortOrder: 1, name: 1 }).lean<CategoryRow[]>().exec();
  },

  /** Per category, over active services: how many, the cheapest price and total bookings (used only to flag the most booked). */
  async activeServiceStats(): Promise<Map<string, CategoryStats>> {
    const rows = await ServiceModel.aggregate<{ _id: Types.ObjectId; count: number; fromPrice: number; bookings: number }>([
      { $match: { isActive: true } },
      { $group: { _id: '$categoryId', count: { $sum: 1 }, fromPrice: { $min: '$basePrice' }, bookings: { $sum: '$bookingsCount' } } },
    ]);
    return new Map(rows.map((r) => [String(r._id), { count: r.count, fromPrice: r.fromPrice, bookings: r.bookings }]));
  },

  findServices(built: BuiltServiceQuery, skip: number, limit: number): Promise<ServiceRow[]> {
    const score = { $meta: 'textScore' } as const;
    const query = ServiceModel.find(built.filter, LIST_FIELDS);
    if (built.textScore) query.select({ score });
    return query
      .sort(built.textScore ? { score, ...built.sort } : built.sort)
      .skip(skip)
      .limit(limit)
      .lean<ServiceRow[]>()
      .exec();
  },

  countServices(built: BuiltServiceQuery): Promise<number> {
    return ServiceModel.countDocuments(built.filter).exec();
  },

  findService(idOrSlug: string): Promise<ServiceRow | null> {
    const where = Types.ObjectId.isValid(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
    return ServiceModel.findOne({ ...where, isActive: true }, `${LIST_FIELDS} addOns`).lean<ServiceRow>().exec();
  },
};
