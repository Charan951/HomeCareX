import http, { type ApiResponse } from '@/lib/http';
import type { PricingAuditEntry, PricingRule, PricingRuleInput } from '@/types/adminPricing';

/**
 * Admin pricing client for /api/v1/admin/pricing.
 *
 * live : the real backend (GET list, PUT upsert, DELETE by id).
 * demo : a local store, used only when the list endpoint is unreachable (decided once, by list()).
 *
 * Audit entries are written to this browser, the same way the Services page does it.
 */

export interface PricingApiError {
  message: string;
  code?: string;
  status?: number;
  /** Field-level messages keyed by the form path, e.g. "surgeWindows.0.startTime". */
  fields?: Record<string, string>;
}
export type PricingApiMode = 'unknown' | 'live' | 'demo';
let mode: PricingApiMode = 'unknown';
let modeReason = '';
let cache: PricingRule[] = [];
export const getPricingApiMode = (): PricingApiMode => mode;
export const getPricingApiModeReason = () => modeReason;
/** Test helper. */
export function __resetPricingApiForTests() { mode = 'unknown'; modeReason = ''; cache = []; }

const STORE_KEY = 'hcx.admin.pricing.v1';
const AUDIT_KEY = 'hcx.admin.pricing.audit.v1';
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120));

function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota or blocked storage */ }
}
function read<T>(key: string, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* corrupt or blocked storage: start fresh */ }
  const v = fallback();
  write(key, v);
  return v;
}

// ---------- wire <-> model ----------
interface RawRule extends Partial<Omit<PricingRule, 'addOns'>> {
  id?: string;
  _id?: string;
  addOns?: { name: string; price: number }[];
}
export function toRule(raw: RawRule): PricingRule {
  return {
    id: String(raw.id ?? raw._id ?? ''),
    categoryId: String(raw.categoryId ?? ''),
    serviceId: raw.serviceId ? String(raw.serviceId) : null,
    city: raw.city ?? '',
    mode: raw.mode === 'HOURLY' ? 'HOURLY' : 'FIXED',
    basePrice: Number(raw.basePrice ?? 0) || 0,
    durationMinutes: Number(raw.durationMinutes ?? 60) || 60,
    addOns: (raw.addOns ?? []).map((a) => ({ name: a.name, price: Number(a.price) || 0 })),
    surgeWindows: (raw.surgeWindows ?? []).map((w) => ({ label: w.label, startTime: w.startTime, endTime: w.endTime, percent: Number(w.percent) || 0 })),
    cancellationFee: Number(raw.cancellationFee ?? 0) || 0,
    active: raw.active ?? true,
    updatedAt: raw.updatedAt,
  };
}

export const toInput = (r: PricingRule): PricingRuleInput => ({
  categoryId: r.categoryId, serviceId: r.serviceId, city: r.city, mode: r.mode, basePrice: r.basePrice,
  durationMinutes: r.durationMinutes, addOns: r.addOns, surgeWindows: r.surgeWindows, cancellationFee: r.cancellationFee, active: r.active,
});

/** Trim and collapse inner spaces: " new   delhi " -> "new delhi". */
export const normalizeCity = (c: string) => c.trim().replace(/\s+/g, ' ');
/** Comparison key: "Hyderabad" and "hyderabad" are the same city. */
export const cityKey = (c: string) => normalizeCity(c).toLowerCase();

const sameScope = (a: { categoryId: string; serviceId: string | null; city: string }, b: { categoryId: string; serviceId: string | null; city: string }) =>
  a.categoryId === b.categoryId && (a.serviceId ?? null) === (b.serviceId ?? null) && cityKey(a.city ?? '') === cityKey(b.city ?? '');

function toErr(e: unknown): PricingApiError {
  const x = e as Partial<PricingApiError> & {
    response?: { status?: number; data?: { message?: string; code?: string; details?: { field: string; message: string }[] } };
  };
  const body = x.response?.data;
  const fields: Record<string, string> = x.fields ? { ...x.fields } : {};
  for (const d of body?.details ?? []) if (!fields[d.field]) fields[d.field] = d.message;
  const status = x.response?.status ?? x.status;
  return {
    message: status === 403 ? 'You need the pricing:manage permission to do this.' : body?.message ?? x.message ?? 'Something went wrong',
    code: body?.code ?? x.code,
    status,
    fields: Object.keys(fields).length ? fields : undefined,
  };
}
const unwrap = <T,>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);

// ---------- audit ----------
const hhmm = (w: { label: string; startTime: string; endTime: string; percent: number }) => `${w.label} ${w.startTime}–${w.endTime} +${w.percent}%`;
const snapshot = (r: PricingRule, label: string): Record<string, unknown> => ({
  scope: label,
  city: r.city || 'All cities',
  mode: r.mode,
  basePrice: r.basePrice,
  durationMinutes: r.durationMinutes,
  cancellationFee: r.cancellationFee,
  addOns: r.addOns.map((a) => `${a.name} ₹${a.price}`),
  surgeWindows: r.surgeWindows.map(hhmm),
  active: r.active,
});
function audit(action: PricingAuditEntry['action'], label: string, before: PricingRule | null, after: PricingRule | null) {
  const target = (after ?? before)!;
  const log = read<PricingAuditEntry[]>(AUDIT_KEY, () => []);
  log.unshift({
    id: uid(), actor: 'You (admin)', action, entityId: target.id, entityName: label, time: now(),
    before: before ? snapshot(before, label) : null, after: after ? snapshot(after, label) : null,
  });
  write(AUDIT_KEY, log.slice(0, 300));
}

// ====================== LIVE ======================
const live = {
  async list() {
    const data = await unwrap(http.get<ApiResponse<{ items: RawRule[] }>>('/admin/pricing'));
    if (!data || !Array.isArray(data.items)) throw { message: 'Unexpected response from /admin/pricing', status: 500 } satisfies PricingApiError;
    cache = data.items.map(toRule);
    return cache;
  },
  async save(raw: PricingRuleInput, label: string): Promise<PricingRule> {
    const prev = cache.find((r) => sameScope(r, raw)) ?? null;
    const input = { ...raw, city: prev ? prev.city : normalizeCity(raw.city) };
    const saved = toRule(await unwrap(http.put<ApiResponse<RawRule>>('/admin/pricing', input)));
    cache = prev ? cache.map((r) => (r.id === prev.id ? saved : r)) : [saved, ...cache];
    audit(prev ? 'update' : 'create', label, prev, saved);
    return saved;
  },
  async setActive(rule: PricingRule, active: boolean, label: string) {
    const saved = toRule(await unwrap(http.put<ApiResponse<RawRule>>('/admin/pricing', { ...toInput(rule), active })));
    cache = cache.map((r) => (r.id === rule.id ? saved : r));
    audit(active ? 'activate' : 'deactivate', label, rule, saved);
    return saved;
  },
  async remove(rule: PricingRule, label: string) {
    await http.delete(`/admin/pricing/${rule.id}`);
    cache = cache.filter((r) => r.id !== rule.id);
    audit('delete', label, rule, null);
  },
};

// ====================== DEMO ======================
function seed(): PricingRule[] {
  const t = now();
  return [
    toRule({
      id: 'p1', categoryId: 'c1a', serviceId: 's1', city: '', mode: 'FIXED', basePrice: 599, durationMinutes: 90, cancellationFee: 99, active: true, updatedAt: t,
      addOns: [{ name: 'Priority slot', price: 99 }, { name: 'Anti-bacterial spray', price: 149 }],
      surgeWindows: [{ label: 'Evening peak', startTime: '18:00', endTime: '20:00', percent: 15 }],
    }),
    toRule({
      id: 'p2', categoryId: 'c2a', serviceId: null, city: '', mode: 'HOURLY', basePrice: 349, durationMinutes: 60, cancellationFee: 49, active: true, updatedAt: t,
      addOns: [{ name: 'Gas refill', price: 1200 }], surgeWindows: [],
    }),
    toRule({
      id: 'p3', categoryId: 'c2a', serviceId: 's3', city: 'Hyderabad', mode: 'FIXED', basePrice: 549, durationMinutes: 60, cancellationFee: 0, active: false, updatedAt: t,
      addOns: [], surgeWindows: [{ label: 'Weekend rush', startTime: '10:00', endTime: '14:00', percent: 10 }],
    }),
  ];
}
const demoAll = () => read<PricingRule[]>(STORE_KEY, seed);
const demoSave = (all: PricingRule[]) => { cache = all; write(STORE_KEY, all); };

const demo = {
  async list() { cache = demoAll(); return delay(cache); },
  async save(raw: PricingRuleInput, label: string): Promise<PricingRule> {
    const all = demoAll();
    const prev = all.find((r) => sameScope(r, raw)) ?? null;
    const saved: PricingRule = { ...raw, city: prev ? prev.city : normalizeCity(raw.city), id: prev?.id ?? uid(), updatedAt: now() };
    demoSave(prev ? all.map((r) => (r.id === prev.id ? saved : r)) : [saved, ...all]);
    audit(prev ? 'update' : 'create', label, prev, saved);
    return delay(saved);
  },
  async setActive(rule: PricingRule, active: boolean, label: string) {
    const saved = { ...rule, active, updatedAt: now() };
    demoSave(demoAll().map((r) => (r.id === rule.id ? saved : r)));
    audit(active ? 'activate' : 'deactivate', label, rule, saved);
    return delay(saved);
  },
  async remove(rule: PricingRule, label: string) {
    demoSave(demoAll().filter((r) => r.id !== rule.id));
    audit('delete', label, rule, null);
    return delay(undefined);
  },
};

// ====================== public client ======================
const backendUnavailable = (e: PricingApiError) => e.status === undefined || e.status === 404 || e.status === 501 || e.status >= 500;
async function run<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { throw toErr(e); }
}

export const adminPricingApi = {
  /** Decides live vs demo. 401/403 are real errors and are shown, never hidden behind demo data. */
  async list(): Promise<PricingRule[]> {
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
  /** Creates the rule, or replaces the one saved for the same category + service + city. `label` is the readable scope for the audit log. */
  save: (input: PricingRuleInput, label: string) => run(() => (mode === 'demo' ? demo : live).save(input, label)),
  setActive: (rule: PricingRule, active: boolean, label: string) => run(() => (mode === 'demo' ? demo : live).setActive(rule, active, label)),
  remove: (rule: PricingRule, label: string) => run(() => (mode === 'demo' ? demo : live).remove(rule, label)),
  auditLog: () => run(async () => read<PricingAuditEntry[]>(AUDIT_KEY, () => [])),
};
