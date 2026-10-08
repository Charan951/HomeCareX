import http, { type ApiResponse } from '@/lib/http';
import { adminCategoryApi } from '@/pages/admin/Services/adminCategoryApi';
import { slugify } from '@/lib/slug';
import { hasErrors, validateService, type CategoryRef } from '@/lib/serviceValidation';
import type {
  AdminService, ChecklistItem, ServiceAddOn, ServiceAuditEntry, ServiceErrors, ServiceFaq, ServiceImage, ServiceInput,
} from '@/types/adminService';

/**
 * Admin services client for /api/v1/admin/services.
 *
 * live  : the real backend. Everything the form edits is sent; fields the server does not persist yet are
 *         reported back in `ignored` so the UI can say so instead of silently losing them.
 * demo  : a local store, used only when the list endpoint is unreachable (decided once, by list()).
 *
 * Audit entries are written to this browser (the backend has no write endpoint for them yet).
 */

export interface ServiceApiError {
  message: string;
  code?: string;
  status?: number;
  /** Field-level messages (client validation or server `details`). */
  fields?: ServiceErrors;
}
const fail = (message: string, code?: string, status = 400, fields?: ServiceErrors): never => {
  throw { message, code, status, fields } satisfies ServiceApiError;
};

export type ServiceApiMode = 'unknown' | 'live' | 'demo';
let mode: ServiceApiMode = 'unknown';
let modeReason = '';
let cache: AdminService[] = [];
export const getServiceApiMode = (): ServiceApiMode => mode;
export const getServiceApiModeReason = () => modeReason;
/** Test helper. */
export function __resetServiceApiForTests() { mode = 'unknown'; modeReason = ''; cache = []; }

const STORE_KEY = 'hcx.admin.services.v1';
const AUDIT_KEY = 'hcx.admin.services.audit.v1';
const ORDER_KEY = 'hcx.admin.serviceOrder';
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));
const OBJECT_ID = /^[a-f\d]{24}$/i;

function read<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* corrupt or blocked storage: start fresh */ }
  const v = fallback();
  write(key, v);
  return v;
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota (large images) */ }
}

// ---------- wire <-> model ----------
interface RawService {
  id: string;
  slug?: string;
  name?: string;
  description?: string;
  categoryId?: string;
  category?: { id: string; name: string; slug?: string } | null;
  basePrice?: number;
  durationMinutes?: number;
  addOns?: { id?: string; name: string; price: number }[];
  media?: { url: string; alt?: string }[];
  inclusions?: string[];
  exclusions?: string[];
  faqs?: { id?: string; question: string; answer: string }[];
  checklist?: { id?: string; label: string; required?: boolean }[];
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function toService(raw: RawService): AdminService {
  const created = raw.createdAt ?? '';
  return {
    id: String(raw.id),
    slug: raw.slug ?? '',
    name: raw.name ?? '',
    description: raw.description ?? '',
    categoryId: String(raw.categoryId ?? raw.category?.id ?? ''),
    categoryName: raw.category?.name ?? '',
    basePrice: Number(raw.basePrice ?? 0) || 0,
    durationMinutes: Number(raw.durationMinutes ?? 60) || 60,
    images: (raw.media ?? []).map((m, i): ServiceImage => ({ id: `img-${i}-${m.url.length}`, url: m.url, alt: m.alt ?? '', isPrimary: i === 0 })),
    inclusions: Array.isArray(raw.inclusions) ? raw.inclusions : [],
    exclusions: Array.isArray(raw.exclusions) ? raw.exclusions : [],
    faqs: (raw.faqs ?? []).map((f, i): ServiceFaq => ({ id: f.id ?? `faq-${i}`, question: f.question, answer: f.answer })),
    addOns: (raw.addOns ?? []).map((a, i): ServiceAddOn => ({ id: a.id ?? `addon-${i}`, name: a.name, price: a.price })),
    checklist: (raw.checklist ?? []).map((c, i): ChecklistItem => ({ id: c.id ?? `chk-${i}`, label: c.label, required: c.required ?? false })),
    active: raw.active ?? true,
    createdAt: created,
    updatedAt: raw.updatedAt ?? created,
  };
}

/** Array order is display order, so the primary image goes first. */
const orderedImages = (images: ServiceImage[]) => [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));

export function toWire(i: ServiceInput) {
  return {
    categoryId: i.categoryId,
    name: i.name.trim(),
    description: i.description.trim(),
    basePrice: i.basePrice,
    durationMinutes: i.durationMinutes,
    active: i.active,
    addOns: i.addOns.map((a) => ({ ...(OBJECT_ID.test(a.id) ? { id: a.id } : {}), name: a.name.trim(), price: a.price })),
    media: orderedImages(i.images).map((m) => ({ url: m.url, alt: m.alt.trim() })),
    inclusions: i.inclusions.map((s) => s.trim()),
    exclusions: i.exclusions.map((s) => s.trim()),
    faqs: i.faqs.map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
    checklist: i.checklist.map((c) => ({ label: c.label.trim(), required: c.required })),
  };
}

/** Sent-but-not-returned list fields: the server accepted the request but did not store them. */
function ignoredFields(sent: ServiceInput, got: AdminService): string[] {
  const out: string[] = [];
  if (sent.images.length && !got.images.length) out.push('images');
  if (sent.inclusions.length && !got.inclusions.length) out.push('inclusions');
  if (sent.exclusions.length && !got.exclusions.length) out.push('exclusions');
  if (sent.faqs.length && !got.faqs.length) out.push('FAQs');
  if (sent.checklist.length && !got.checklist.length) out.push('checklist');
  return out;
}

function toErr(e: unknown): ServiceApiError {
  const x = e as Partial<ServiceApiError> & {
    details?: { field: string; message: string }[];
    response?: { status?: number; data?: { message?: string; code?: string; details?: { field: string; message: string }[] } };
  };
  const body = x.response?.data;
  const status = x.response?.status ?? x.status;
  const details = body?.details ?? x.details;
  const fields: ServiceErrors = x.fields ? { ...x.fields } : {};
  for (const d of details ?? []) {
    const key = d.field.split('.')[0] as keyof ServiceErrors;
    if (!fields[key]) fields[key] = d.message;
  }
  return {
    message: body?.message ?? x.message ?? 'Something went wrong',
    code: body?.code ?? x.code,
    status,
    fields: Object.keys(fields).length ? fields : undefined,
  };
}
const unwrap = <T,>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

// ---------- audit ----------
const snapshot = (s: AdminService): Record<string, unknown> => ({
  name: s.name, category: s.categoryName || s.categoryId, description: s.description, basePrice: s.basePrice,
  durationMinutes: s.durationMinutes, active: s.active, images: s.images.length, inclusions: s.inclusions,
  exclusions: s.exclusions, faqs: s.faqs.length, addOns: s.addOns.map((a) => `${a.name} ₹${a.price}`),
  checklist: s.checklist.map((c) => c.label),
});
function audit(action: ServiceAuditEntry['action'], target: AdminService, before: AdminService | null, after: AdminService | null) {
  const log = read<ServiceAuditEntry[]>(AUDIT_KEY, () => []);
  log.unshift({
    id: uid(), actor: 'You (admin)', action, entityId: target.id, entityName: target.name, time: now(),
    before: before ? snapshot(before) : null, after: after ? snapshot(after) : null,
  });
  write(AUDIT_KEY, log.slice(0, 300));
}

/** Display order is kept in this browser until the backend has a sortOrder field for services. */
function readOrder(): string[] {
  try { const v = JSON.parse(localStorage.getItem(ORDER_KEY) ?? '[]') as unknown; return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []; } catch { return []; }
}
function saveReorder(ids: string[], moved: { id: string; name: string; from: number; to: number }) {
  write(ORDER_KEY, ids);
  const log = read<ServiceAuditEntry[]>(AUDIT_KEY, () => []);
  log.unshift({
    id: uid(), actor: 'You (admin)', action: 'reorder', entityId: moved.id, entityName: moved.name, time: now(),
    before: { position: moved.from + 1 }, after: { position: moved.to + 1 },
  });
  write(AUDIT_KEY, log.slice(0, 300));
}

// ---------- browser-side overlay for fields the backend does not persist yet (same approach as categories) ----------
const EXTRAS_KEY = 'hcx.admin.services.extras.v1';
type Extras = Pick<AdminService, 'images' | 'inclusions' | 'exclusions' | 'faqs' | 'checklist'>;
const readExtras = (): Record<string, Extras> => {
  try { const v = JSON.parse(localStorage.getItem(EXTRAS_KEY) ?? '{}') as unknown; return v && typeof v === 'object' ? (v as Record<string, Extras>) : {}; } catch { return {}; }
};
/** Returns false when the browser refuses the write (quota: large images). */
const putExtras = (all: Record<string, Extras>): boolean => {
  try { localStorage.setItem(EXTRAS_KEY, JSON.stringify(all)); return true; } catch { return false; }
};
/** Server data wins; the overlay only fills fields the server returned empty. */
const applyExtras = (s: AdminService, ex?: Extras): AdminService => (!ex ? s : {
  ...s,
  images: s.images.length ? s.images : ex.images ?? [],
  inclusions: s.inclusions.length ? s.inclusions : ex.inclusions ?? [],
  exclusions: s.exclusions.length ? s.exclusions : ex.exclusions ?? [],
  faqs: s.faqs.length ? s.faqs : ex.faqs ?? [],
  checklist: s.checklist.length ? s.checklist : ex.checklist ?? [],
});
function storeExtras(id: string, input: ServiceInput): boolean {
  const all = readExtras();
  all[id] = { images: input.images, inclusions: input.inclusions, exclusions: input.exclusions, faqs: input.faqs, checklist: input.checklist };
  return putExtras(all);
}
function dropExtras(id: string) { const all = readExtras(); delete all[id]; putExtras(all); }

function check(input: ServiceInput, categories: CategoryRef[]) {
  const errors = validateService(input, categories);
  if (hasErrors(errors)) fail('Please fix the highlighted fields', 'VALIDATION', 400, errors);
}

export interface SaveResult {
  service: AdminService;
  /** Fields that could not be stored anywhere (server ignored them AND browser storage failed). */
  ignored: string[];
  /** Fields the server does not persist yet; kept in this browser so they still show up. */
  localOnly?: string[];
}
export interface BulkResult { changed: string[]; failed: { id: string; name: string; message: string }[] }

// ====================== LIVE ======================
const live = {
  async list() {
    const rows = await unwrap(http.get<ApiResponse<RawService[]>>('/admin/services'));
    if (!Array.isArray(rows)) throw { message: 'Unexpected response from /admin/services', status: 500 } satisfies ServiceApiError;
    const extras = readExtras();
    cache = rows.map((r) => { const sv = toService(r); return applyExtras(sv, extras[sv.id]); });
    return cache;
  },
  async create(input: ServiceInput, categories: CategoryRef[]): Promise<SaveResult> {
    check(input, categories);
    const fromServer = toService(await unwrap(http.post<ApiResponse<RawService>>('/admin/services', toWire(input))));
    const missing = ignoredFields(input, fromServer);
    const stored = storeExtras(fromServer.id, input);
    const service = applyExtras(fromServer, readExtras()[fromServer.id]);
    cache = [...cache, service];
    audit('create', service, null, service);
    return stored ? { service, ignored: [], localOnly: missing } : { service, ignored: missing };
  },
  async update(id: string, input: ServiceInput, categories: CategoryRef[]): Promise<SaveResult> {
    check(input, categories);
    const prev = cache.find((s) => s.id === id) ?? null;
    const fromServer = toService(await unwrap(http.patch<ApiResponse<RawService>>(`/admin/services/${id}`, toWire(input))));
    const missing = ignoredFields(input, fromServer);
    const stored = storeExtras(id, input);
    const service = applyExtras(fromServer, readExtras()[id]);
    cache = cache.map((s) => (s.id === id ? service : s));
    audit('update', service, prev, service);
    return stored ? { service, ignored: [], localOnly: missing } : { service, ignored: missing };
  },
  /** No bulk endpoint yet: one PATCH per service, each outcome reported separately. */
  async setActive(ids: string[], active: boolean): Promise<BulkResult> {
    const targets = cache.filter((s) => ids.includes(s.id) && s.active !== active);
    const settled = await Promise.allSettled(targets.map((s) => http.patch(`/admin/services/${s.id}`, { active })));
    const result: BulkResult = { changed: [], failed: [] };
    settled.forEach((r, i) => {
      const s = targets[i];
      if (r.status === 'fulfilled') {
        const next = { ...s, active, updatedAt: now() };
        cache = cache.map((c) => (c.id === s.id ? next : c));
        audit(active ? 'activate' : 'deactivate', next, s, next);
        result.changed.push(s.id);
      } else {
        result.failed.push({ id: s.id, name: s.name, message: toErr(r.reason).message });
      }
    });
    return result;
  },
  async remove(id: string) {
    const target = cache.find((s) => s.id === id);
    await http.delete(`/admin/services/${id}`); // 409 SERVICE_IN_USE when bookings exist
    cache = cache.filter((s) => s.id !== id);
    dropExtras(id);
    if (target) audit('delete', target, target, null);
  },
};

// ====================== DEMO ======================
function seed(): AdminService[] {
  const t = now();
  const mk = (id: string, name: string, categoryId: string, categoryName: string, basePrice: number, durationMinutes: number, active = true): AdminService => toService({
    id, slug: slugify(name), name, categoryId, category: { id: categoryId, name: categoryName }, basePrice, durationMinutes, active,
    description: `${name} by verified professionals, at your doorstep.`,
    inclusions: ['Trained, verified partner', 'Standard tools and consumables'], exclusions: ['Spare parts', 'Civil or structural work'],
    faqs: [{ question: 'Is there a warranty?', answer: 'Yes, 30 days on workmanship.' }],
    addOns: [{ name: 'Priority slot', price: 99 }],
    checklist: [{ label: 'Confirm scope with customer', required: true }, { label: 'Photo of finished work', required: false }],
    createdAt: t, updatedAt: t,
  });
  return [
    mk('s1', 'Bathroom Deep Cleaning', 'c1a', 'Bathroom Cleaning', 599, 90),
    mk('s2', 'Sofa Shampooing', 'c1b', 'Sofa & Carpet', 799, 120),
    mk('s3', 'AC Jet Service', 'c2a', 'AC Service', 499, 60),
    mk('s4', 'Full Body Massage', 'c3', 'Salon & Spa', 1499, 75, false),
  ];
}
const demoAll = () => read<AdminService[]>(STORE_KEY, seed);
const demoSave = (all: AdminService[]) => { cache = all; write(STORE_KEY, all); };
const uniqueSlug = (all: AdminService[], name: string, selfId?: string) => {
  const base = slugify(name) || 'service';
  let slug = base;
  for (let n = 2; all.some((s) => s.id !== selfId && s.slug === slug); n += 1) slug = `${base}-${n}`;
  return slug;
};

const demo = {
  async list() { cache = demoAll(); return delay(cache); },
  async create(input: ServiceInput, categories: CategoryRef[], names: Map<string, string>): Promise<SaveResult> {
    check(input, categories);
    const all = demoAll();
    const t = now();
    const service: AdminService = {
      ...input, name: input.name.trim(), description: input.description.trim(), id: uid(), slug: uniqueSlug(all, input.name),
      categoryName: names.get(input.categoryId) ?? '', createdAt: t, updatedAt: t,
    };
    demoSave([...all, service]);
    adminCategoryApi.adjustDemoServiceCount(input.categoryId, 1);
    audit('create', service, null, service);
    return delay({ service, ignored: [] });
  },
  async update(id: string, input: ServiceInput, categories: CategoryRef[], names: Map<string, string>): Promise<SaveResult> {
    check(input, categories);
    const all = demoAll();
    const prev = all.find((s) => s.id === id);
    if (!prev) return fail('Service not found', 'NOT_FOUND', 404);
    const service: AdminService = { ...prev, ...input, name: input.name.trim(), description: input.description.trim(), categoryName: names.get(input.categoryId) ?? prev.categoryName, updatedAt: now() };
    demoSave(all.map((s) => (s.id === id ? service : s)));
    if (prev.categoryId !== input.categoryId) {
      adminCategoryApi.adjustDemoServiceCount(prev.categoryId, -1);
      adminCategoryApi.adjustDemoServiceCount(input.categoryId, 1);
    }
    audit('update', service, prev, service);
    return delay({ service, ignored: [] });
  },
  async setActive(ids: string[], active: boolean): Promise<BulkResult> {
    const changed: string[] = [];
    const out = demoAll().map((s) => {
      if (!ids.includes(s.id) || s.active === active) return s;
      const next = { ...s, active, updatedAt: now() };
      audit(active ? 'activate' : 'deactivate', next, s, next);
      changed.push(s.id);
      return next;
    });
    demoSave(out);
    return delay({ changed, failed: [] });
  },
  async remove(id: string) {
    const all = demoAll();
    const target = all.find((s) => s.id === id);
    if (!target) return fail('Service not found', 'NOT_FOUND', 404);
    demoSave(all.filter((s) => s.id !== id));
    adminCategoryApi.adjustDemoServiceCount(target.categoryId, -1);
    audit('delete', target, target, null);
    return delay(undefined);
  },
};

// ====================== public client ======================
const backendUnavailable = (e: ServiceApiError) => e.status === undefined || e.status === 404 || e.status === 501 || e.status >= 500;
async function run<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { throw toErr(e); }
}
const nameMap = (cats: { id: string; name: string }[]) => new Map(cats.map((c) => [c.id, c.name]));

export interface CategoryOption extends CategoryRef { name: string }

export const adminServiceApi = {
  /** Decides live vs demo. 401/403 are real errors and are shown, never hidden behind demo data. */
  async list(): Promise<AdminService[]> {
    if (mode === 'demo') return demo.list();
    try {
      const rows = await live.list();
      mode = 'live';
      modeReason = '';
      return rows;
    } catch (e) {
      const err = toErr(e);
      if (mode === 'unknown' && backendUnavailable(err)) {
        mode = 'demo';
        modeReason = err.status ? `server answered ${err.status}` : 'no response';
        return demo.list();
      }
      throw err;
    }
  },
  create: (input: ServiceInput, categories: CategoryOption[]) =>
    run(() => (mode === 'demo' ? demo.create(input, categories, nameMap(categories)) : live.create(input, categories))),
  update: (id: string, input: ServiceInput, categories: CategoryOption[]) =>
    run(() => (mode === 'demo' ? demo.update(id, input, categories, nameMap(categories)) : live.update(id, input, categories))),
  setActive: (ids: string[], active: boolean) => run(() => (mode === 'demo' ? demo : live).setActive(ids, active)),
  remove: (id: string) => run(() => (mode === 'demo' ? demo : live).remove(id)),
  auditLog: () => run(async () => read<ServiceAuditEntry[]>(AUDIT_KEY, () => [])),
  getOrder: (): string[] => readOrder(),
  /** Saves the new display order and records who moved what, from which position to which. */
  reorder: (ids: string[], moved: { id: string; name: string; from: number; to: number }) => { saveReorder(ids, moved); },
};
