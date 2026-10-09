export type PricingMode = "FIXED" | "HOURLY";

export interface SurgeWindow {
  label: string;
  startTime: string;
  endTime: string;
  percent: number;
}

export interface PricingAddOn {
  name: string;
  price: number;
}

/** Body of PUT /admin/pricing and the rule returned by GET/PUT. */
export interface PricingRuleInput {
  categoryId: string;
  serviceId: string | null;
  /** "" = every city. */
  city: string;
  mode: PricingMode;
  basePrice: number;
  durationMinutes: number;
  addOns: PricingAddOn[];
  surgeWindows: SurgeWindow[];
  cancellationFee: number;
  active: boolean;
}

export interface PricingRule extends PricingRuleInput {
  id: string;
  updatedAt?: string;
}

export interface PricingScope {
  categoryId: string;
  serviceId: string | null;
  city: string;
}

export interface CategoryOption {
  id: string;
  /** Display label, e.g. "Home Cleaning › Bathroom Cleaning". */
  name: string;
  active: boolean;
}

export interface ServiceOption {
  id: string;
  name: string;
  categoryId: string;
  basePrice: number;
  durationMinutes: number;
}

export interface PricingAuditEntry {
  id: string;
  actor: string;
  action: 'create' | 'update' | 'activate' | 'deactivate' | 'delete';
  entityId: string;
  /** Readable scope, e.g. "Bathroom Deep Cleaning · Hyderabad". */
  entityName: string;
  time: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

/** Form values are strings so the inputs can be cleared and validated before saving. */
export interface PricingFormValues {
  mode: PricingMode;
  basePrice: string;
  durationMinutes: string;
  cancellationFee: string;
  active: boolean;
  addOns: { name: string; price: string }[];
  surgeWindows: { label: string; startTime: string; endTime: string; percent: string }[];
}

export type PricingFormErrors = Record<string, string>;
