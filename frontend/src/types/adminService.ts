/** Admin catalog: services. Mirrors the Service model (backend/src/models/Service.ts) plus the checklist template. */

export interface ServiceImage {
  id: string;
  url: string;
  alt: string;
  /** Exactly one image is primary. On the wire the primary image is sent first (array order = display order). */
  isPrimary: boolean;
}

export interface ServiceFaq {
  id: string;
  question: string;
  answer: string;
}

export interface ServiceAddOn {
  id: string;
  name: string;
  /** Rupees. */
  price: number;
}

/** One line of the checklist a partner ticks off on site. */
export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

export interface AdminService {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  /** Rupees. */
  basePrice: number;
  durationMinutes: number;
  images: ServiceImage[];
  inclusions: string[];
  exclusions: string[];
  faqs: ServiceFaq[];
  addOns: ServiceAddOn[];
  checklist: ChecklistItem[];
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** What the form edits and what create/update send. */
export interface ServiceInput {
  name: string;
  categoryId: string;
  description: string;
  basePrice: number;
  durationMinutes: number;
  images: ServiceImage[];
  inclusions: string[];
  exclusions: string[];
  faqs: ServiceFaq[];
  addOns: ServiceAddOn[];
  checklist: ChecklistItem[];
  active: boolean;
}

export type ServiceField = keyof ServiceInput;
export type ServiceErrors = Partial<Record<ServiceField, string>>;

export interface ServiceAuditEntry {
  id: string;
  actor: string;
  action: 'create' | 'update' | 'activate' | 'deactivate' | 'delete' | 'reorder';
  entityId: string;
  entityName: string;
  time: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export type ServiceStatusFilter = 'all' | 'active' | 'inactive';

export interface ServiceFilters {
  q: string;
  categoryId: string;
  status: ServiceStatusFilter;
}

export const DEFAULT_SERVICE_FILTERS: ServiceFilters = { q: '', categoryId: '', status: 'all' };

export const SERVICE_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  descriptionMax: 1000,
  priceMax: 1_000_000,
  durationMin: 5,
  durationMax: 1440,
  images: 8,
  imageAltMax: 160,
  listItems: 20,
  listItemMax: 200,
  faqs: 20,
  faqQuestionMax: 200,
  faqAnswerMax: 1000,
  addOns: 20,
  addOnNameMin: 2,
  addOnNameMax: 60,
  checklist: 30,
  checklistLabelMax: 120,
} as const;
