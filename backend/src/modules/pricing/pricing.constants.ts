/**
 * Pricing rules, in one place. POST /pricing/quote (what the customer sees) and POST /bookings
 * (what is stored and charged) both go through calculatePricing, so the two can never disagree.
 */
export const GST_RATE = 0.18;
/** Fallback surge, used only when no PricingRule applies: a percentage of (base + add-ons) from SURGE_FROM_MINUTES. */
export const SURGE_RATE = 0.1;
export const SURGE_FROM_MINUTES = 18 * 60; // 18:00
export const SURGE_LABEL = 'Evening demand';

/** How long a quote id stays valid. */
export const QUOTE_TTL_MINUTES = 15;

export const AUDIT_ENTITY = 'PricingRule';
export const AUDIT_ACTION = {
  created: 'PRICING_RULE_CREATED',
  updated: 'PRICING_RULE_UPDATED',
  deleted: 'PRICING_RULE_DELETED',
} as const;

export const PRICING_CONSTANTS = { GST_RATE, SURGE_RATE, SURGE_FROM_MINUTES, SURGE_LABEL, QUOTE_TTL_MINUTES };
