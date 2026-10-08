import { SERVICE_LIMITS as L, type ServiceErrors, type ServiceInput } from '@/types/adminService';

export interface CategoryRef {
  id: string;
  active: boolean;
}

const blank = (v: string) => v.trim().length === 0;

/**
 * One validator for the form and the API client, so both give the same answer.
 * `categories` is the list the admin may pick from; an unknown id is "Invalid category".
 */
export function validateService(input: ServiceInput, categories: CategoryRef[]): ServiceErrors {
  const e: ServiceErrors = {};
  const name = input.name.trim();

  if (name.length < L.nameMin) e.name = `Name must be at least ${L.nameMin} characters`;
  else if (name.length > L.nameMax) e.name = `Name must be ${L.nameMax} characters or fewer`;

  if (!input.categoryId) e.categoryId = 'Choose a category';
  else if (!categories.some((c) => c.id === input.categoryId)) e.categoryId = 'Invalid category: it no longer exists';

  if (input.description.length > L.descriptionMax) e.description = `Description must be ${L.descriptionMax} characters or fewer`;

  if (!Number.isFinite(input.basePrice) || input.basePrice < 0) e.basePrice = 'Enter a price of 0 or more';
  else if (input.basePrice > L.priceMax) e.basePrice = `Price cannot exceed ₹${L.priceMax.toLocaleString('en-IN')}`;

  if (!Number.isInteger(input.durationMinutes) || input.durationMinutes < L.durationMin || input.durationMinutes > L.durationMax) {
    e.durationMinutes = `Duration must be a whole number between ${L.durationMin} and ${L.durationMax} minutes`;
  }

  if (input.images.length > L.images) e.images = `At most ${L.images} images`;
  else if (input.images.some((i) => i.alt.length > L.imageAltMax)) e.images = `Alt text must be ${L.imageAltMax} characters or fewer`;

  for (const key of ['inclusions', 'exclusions'] as const) {
    const list = input[key];
    if (list.length > L.listItems) e[key] = `At most ${L.listItems} items`;
    else if (list.some(blank)) e[key] = 'Remove or fill the empty line';
    else if (list.some((s) => s.length > L.listItemMax)) e[key] = `Each line must be ${L.listItemMax} characters or fewer`;
    else if (new Set(list.map((s) => s.trim().toLowerCase())).size !== list.length) e[key] = 'Duplicate lines';
  }

  if (input.faqs.length > L.faqs) e.faqs = `At most ${L.faqs} FAQs`;
  else if (input.faqs.some((f) => blank(f.question) || blank(f.answer))) e.faqs = 'Every FAQ needs a question and an answer';
  else if (input.faqs.some((f) => f.question.length > L.faqQuestionMax || f.answer.length > L.faqAnswerMax)) {
    e.faqs = `Questions max ${L.faqQuestionMax}, answers max ${L.faqAnswerMax} characters`;
  }

  if (input.addOns.length > L.addOns) e.addOns = `At most ${L.addOns} add-ons`;
  else if (input.addOns.some((a) => a.name.trim().length < L.addOnNameMin || a.name.trim().length > L.addOnNameMax)) {
    e.addOns = `Add-on names must be ${L.addOnNameMin}–${L.addOnNameMax} characters`;
  } else if (input.addOns.some((a) => !Number.isFinite(a.price) || a.price < 0 || a.price > L.priceMax)) {
    e.addOns = 'Add-on prices must be between 0 and 10,00,000';
  } else if (new Set(input.addOns.map((a) => a.name.trim().toLowerCase())).size !== input.addOns.length) {
    e.addOns = 'Duplicate add-on names';
  }

  if (input.checklist.length > L.checklist) e.checklist = `At most ${L.checklist} checklist items`;
  else if (input.checklist.some((c) => blank(c.label))) e.checklist = 'Remove or fill the empty checklist item';
  else if (input.checklist.some((c) => c.label.length > L.checklistLabelMax)) e.checklist = `Each item must be ${L.checklistLabelMax} characters or fewer`;

  return e;
}

export const hasErrors = (e: ServiceErrors) => Object.keys(e).length > 0;
