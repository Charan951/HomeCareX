export type CouponType = 'PERCENT' | 'FLAT';

export interface CouponDto {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  startAt: string;
  endAt: string;
  totalLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  categoryIds: string[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidateInput {
  serviceId: string;
  quantity: number;
  addOns: {
    addOnId: string;
    quantity: number;
  }[];
  date: string;
  slot: string;
  couponCode: string;
}

export interface CouponValidateResult {
  code: string;
  discount: number;
}

export interface CouponListQuery {
  search?: string;
  active?: boolean;
}