export interface QuoteLine {
  kind: 'BASE' | 'ADDON';
  refId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  amount: number;
}

export interface QuoteAddOnInput {
  addOnId: string;
  quantity: number;
}

export interface QuoteInput {
  serviceId: string;
  quantity: number;
  addOns: QuoteAddOnInput[];
  date: string;
  slot: string;
  /** Optional: picks a city-specific PricingRule. */
  city?: string;
  couponCode?: string;
}

/** The money part of a quote. Whole rupees. total = subtotal - discount + convenienceFee + gst. */
export interface PricingBreakdown {
  addOnsTotal: number;
  surge: number;
  surgeLabel?: string;
  /** base + add-ons + surge */
  subtotal: number;
  discount: number;
  convenienceFee: number;
  gst: number;
  total: number;
}

/** Response of POST /pricing/quote. Matches frontend/src/types/pricing.ts (PriceQuote). */
export interface PriceQuote extends PricingBreakdown {
  /** Server-issued id; the quote is valid until expiresAt. */
  quoteId: string;
  expiresAt: string;
  currency: 'INR';
  mode: 'FIXED' | 'HOURLY';
  /** Fee charged if the customer cancels late. Informational here. */
  cancellationFee: number;
  lines: QuoteLine[];
  coupon: { code: string; discount: number } | null;
  couponError?: { code: string; minOrder?: number };
  computedAt: string;
}

export interface PricingTypes {
  QuoteInput: QuoteInput;
  PriceQuote: PriceQuote;
}