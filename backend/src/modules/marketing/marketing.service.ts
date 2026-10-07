import { Types } from 'mongoose';
import { HttpError } from '../auth/auth.types';
import { marketingValidation } from './marketing.validation';
import { marketingRepository } from './marketing.repository';
import type { BannerDto } from './marketing.types';

interface BannerDocumentLike {
  _id: Types.ObjectId;
  title: string;
  image: string;
  link?: string;
  placement:
    | 'HOME'
    | 'HOME_TOP'
    | 'HOME_MIDDLE'
    | 'HOME_BOTTOM';
  startAt: Date;
  endAt: Date;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const toDto = (
  banner: BannerDocumentLike,
): BannerDto => ({
  id: banner._id.toString(),
  title: banner.title,
  image: banner.image,
  link: banner.link ?? '',
  placement: banner.placement,
  startAt: banner.startAt.toISOString(),
  endAt: banner.endAt.toISOString(),
  order: banner.order ?? 0,
  active: banner.active,
  createdAt: banner.createdAt.toISOString(),
  updatedAt: banner.updatedAt.toISOString(),
});

export class MarketingService {
  async listAdmin(): Promise<BannerDto[]> {
    const banners = await marketingRepository.listAdmin();

    return banners.map((banner) =>
      toDto(
        banner as unknown as BannerDocumentLike,
      ),
    );
  }

  async getById(
    id: string,
  ): Promise<BannerDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(
        404,
        'Banner not found',
        'NOT_FOUND',
      );
    }

    const banner =
      await marketingRepository.findById(id);

    if (!banner) {
      throw new HttpError(
        404,
        'Banner not found',
        'NOT_FOUND',
      );
    }

    return toDto(
      banner as unknown as BannerDocumentLike,
    );
  }

  async create(
    input: unknown,
  ): Promise<BannerDto> {
    const result =
      marketingValidation.bannerCreateSchema.safeParse(
        input,
      );

    if (!result.success) {
      const error = new HttpError(
        422,
        'Invalid banner data',
        'VALIDATION_ERROR',
      );

      error.details = result.error.issues.map(
        (issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }),
      );

      throw error;
    }

    const banner =
      await marketingRepository.create(
        result.data,
      );

    return toDto(
      banner as unknown as BannerDocumentLike,
    );
  }

  async update(
    id: string,
    input: unknown,
  ): Promise<BannerDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(
        404,
        'Banner not found',
        'NOT_FOUND',
      );
    }

    const existing =
      await marketingRepository.findById(id);

    if (!existing) {
      throw new HttpError(
        404,
        'Banner not found',
        'NOT_FOUND',
      );
    }

    const result =
      marketingValidation.bannerUpdateSchema.safeParse(
        input,
      );

    if (!result.success) {
      const error = new HttpError(
        422,
        'Invalid banner data',
        'VALIDATION_ERROR',
      );

      error.details = result.error.issues.map(
        (issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }),
      );

      throw error;
    }

    const data = result.data;

    const startAt =
      data.startAt ?? existing.startAt;

    const endAt =
      data.endAt ?? existing.endAt;

    if (endAt <= startAt) {
      const error = new HttpError(
        422,
        'End date must be after start date',
        'VALIDATION_ERROR',
      );

      error.details = [
        {
          field: 'endAt',
          message:
            'End date must be after start date',
        },
      ];

      throw error;
    }

    const banner =
      await marketingRepository.update(
        id,
        data,
      );

    if (!banner) {
      throw new HttpError(
        404,
        'Banner not found',
        'NOT_FOUND',
      );
    }

    return toDto(
      banner as unknown as BannerDocumentLike,
    );
  }

  async remove(
    id: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new HttpError(
        404,
        'Banner not found',
        'NOT_FOUND',
      );
    }

    const banner =
      await marketingRepository.remove(id);

    if (!banner) {
      throw new HttpError(
        404,
        'Banner not found',
        'NOT_FOUND',
      );
    }
  }

  async listPublic(
    placement?: string,
  ): Promise<BannerDto[]> {
    const banners =
      await marketingRepository.listPublic(
        placement,
      );

    return banners.map((banner) =>
      toDto(
        banner as unknown as BannerDocumentLike,
      ),
    );
  }
}

export const marketingService =
  new MarketingService();