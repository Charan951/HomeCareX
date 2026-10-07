/** Star -> how many visible reviews gave it. Always has all five keys, zero-filled. */
export type StarDistribution = Record<'1' | '2' | '3' | '4' | '5', number>;

export interface ReviewSummaryDto {
  /** Mean of the visible reviews, rounded to one decimal (0 when there are none). */
  average: number;
  count: number;
  distribution: StarDistribution;
}

/** Public review shape: no email, no customer id, no moderation status. */
export interface PublicReviewDto {
  id: string;
  rating: number;
  comment: string;
  /** First name + last initial, e.g. "Ravi K." */
  author: string;
  /** True when the review comes from a completed booking of this service. */
  verified: boolean;
  createdAt: string;
}

export interface ReviewPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ServiceReviewsResult {
  summary: ReviewSummaryDto;
  reviews: PublicReviewDto[];
  meta: ReviewPageMeta;
}
