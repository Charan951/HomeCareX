import http, { type ApiResponse } from '@/lib/http';
import type {
  AdminCategory, CategoryAuditEntry, CategoryImage, CategoryInput, ReorderItem,
} from '@/types/adminCatalog';

/**
 * Admin categories client for /api/v1/admin/categories.
 *
 * Today's backend (categories.service.ts) is flat: GET, POST, PATCH /:id, DELETE /:id with
 * { name, slug, description, icon, sortOrder, active, services }. This client therefore:
 *   - sends everything the backend understands (name, description, icon, active, sortOrder) to it;
 *   - keeps what it does not model yet (parent link, images, icon image) in a browser-side overlay
 *     keyed by category id, merged into every list;
 *   - writes the audit trail to the browser until a backend audit endpoint exists.
 * If the list endpoint is unreachable it switches to a fully local demo store.
 * The mode is decided once, by list(), never by a failing write.
 */

export interface CategoryApiError { message: string; code?: string; status?: number }
const fail = (message: string, code?: string, status = 400): never => {
  throw { message, code, status } satisfies CategoryApiError;
};

/** What the backend (or the demo store) may return. Extended fields are optional on purpose. */
type RawCategory = Pick<AdminCategory, 'id' | 'name' | 'slug'> & Partial<Omit<AdminCategory, 'id' | 'name' | 'slug'>>;

export type ApiMode = 'unknown' | 'live' | 'demo';
let mode: ApiMode = 'unknown';
let modeReason = '';
let cache: AdminCategory[] = [];

export const getApiMode = (): ApiMode => mode;
export const getApiModeReason = () => modeReason;
/** @deprecated use getApiMode() */
export const isOfflineMock = () => mode === 'demo';

const STORE_KEY = 'hcx.admin.categories.v1';        // demo mode: whole catalogue
const EXTRAS_KEY = 'hcx.admin.categories.extras.v1'; // live mode: parent/images overlay
const AUDIT_KEY = 'hcx.admin.categories.audit.v1';
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const delay = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 150));

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

// ---------- normalisation: the one place that guarantees a complete AdminCategory ----------
interface Extras { parentId: string | null; images: CategoryImage[]; iconUrl?: string; createdAt: string }
type ExtrasMap = Record<string, Extras>;

export function toCategory(raw: RawCategory, ex?: Extras): AdminCategory {
  const created = raw.createdAt ?? ex?.createdAt ?? '';
  return {
    id: String(raw.id),
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    description: raw.description ?? '',
    icon: raw.icon ?? '',
    sortOrder: Number(raw.sortOrder ?? 0) || 0,
    active: raw.active ?? true,
    services: Number(raw.services ?? 0) || 0,
    parentId: raw.parentId ?? ex?.parentId ?? null,
    images: Array.isArray(raw.images) ? raw.images : ex?.images ?? [],
    iconUrl: raw.iconUrl ?? ex?.iconUrl,
    createdAt: created,
    updatedAt: raw.updatedAt ?? created,
  };
}

const toErr = (e: unknown): CategoryApiError => {
  const x = e as Partial<CategoryApiError> & { response?: { status?: number; data?: { message?: string; code?: string } } };
  if (x.response) return { message: x.response.data?.message ?? 'Request failed', code: x.response.data?.code, status: x.response.status };
  return { message: x.message ?? 'Something went wrong', code: x.code, status: x.status };
};

// ---------- audit (browser-side until the backend exposes one) ----------
const snapshot = (c: AdminCategory): Record<string, unknown> => ({
  name: c.name, slug: c.slug, parentId: c.parentId, description: c.description, icon: c.icon,
  active: c.active, sortOrder: c.sortOrder, images: c.images.length,
});
function audit(action: CategoryAuditEntry['action'], target: AdminCategory, before: AdminCategory | null, after: AdminCategory | null) {
  const log = read<CategoryAuditEntry[]>(AUDIT_KEY, () => []);
  log.unshift({
    id: uid(), actor: 'You (admin)', action, entityId: target.id, entityName: target.name, time: now(),
    before: before ? snapshot(before) : null, after: after ? snapshot(after) : null,
  });
  write(AUDIT_KEY, log.slice(0, 200));
}

// ---------- shared rules ----------
const siblings = (all: AdminCategory[], parentId: string | null) =>
  all.filter((c) => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

function validate(all: AdminCategory[], input: CategoryInput, selfId?: string, checkSlug = true) {
  const name = input.name.trim();
  if (name.length < 2) fail('Name must be at least 2 characters', 'VALIDATION');
  if (name.length > 60) fail('Name must be 60 characters or fewer', 'VALIDATION');
  if (checkSlug && all.some((c) => c.id !== selfId && c.slug === input.slug)) fail(`Slug “${input.slug}” is already used`, 'DUPLICATE_SLUG', 409);
  if (all.some((c) => c.id !== selfId && c.name.trim().toLowerCase() === name.toLowerCase())) {
    fail(`“${name}” already exists`, 'DUPLICATE_CATEGORY', 409);
  }
  if (input.parentId) {
    const parent = all.find((c) => c.id === input.parentId);
    if (!parent) fail('Parent category not found', 'NOT_FOUND', 404);
    if (parent && parent.parentId) fail('Only two levels are supported: a sub-category cannot have children', 'DEPTH');
    if (selfId && input.parentId === selfId) fail('A category cannot be its own parent', 'DEPTH');
    if (selfId && all.some((c) => c.parentId === selfId)) fail('This category has sub-categories, so it cannot become one', 'DEPTH');
  }
}
const inUseMessage = (c: AdminCategory) =>
  `${c.services} service${c.services === 1 ? ' is' : 's are'} still in “${c.name}”. Move or delete them first, or deactivate the category.`;

/** parent, its children, next parent...: position in this walk is the category's public sortOrder. */
function flattenOrder(all: AdminCategory[]): Map<string, number> {
  const out = new Map<string, number>();
  let n = 0;
  const byOrder = (a: AdminCategory, b: AdminCategory) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
  const ids = new Set(all.map((c) => c.id));
  const roots = all.filter((c) => !c.parentId || !ids.has(c.parentId)).sort(byOrder);
  for (const p of roots) {
    out.set(p.id, n++);
    for (const k of all.filter((c) => c.parentId === p.id).sort(byOrder)) out.set(k.id, n++);
  }
  return out;
}
const nextPublicOrder = (all: AdminCategory[]) => all.reduce((m, c) => Math.max(m, c.sortOrder), -1) + 1;

// ====================== LIVE: real backend + overlay ======================
const unwrap = <T,>(p: Promise<{ data: ApiResponse<T> }>) => p.then((r) => r.data.data);
const readExtras = () => read<ExtrasMap>(EXTRAS_KEY, () => ({}));
const putExtras = (m: ExtrasMap) => write(EXTRAS_KEY, m);

const live = {
  async list() {
    const rows = await unwrap(http.get<ApiResponse<RawCategory[]>>('/admin/categories'));
    if (!Array.isArray(rows)) throw { message: 'Unexpected response from /admin/categories', status: 500 } satisfies CategoryApiError;
    const extras = readExtras();
    const next: ExtrasMap = {};
    const ids = new Set(rows.map((r) => String(r.id)));
    for (const r of rows) {
      const ex = extras[String(r.id)] ?? { parentId: null, images: [], createdAt: now() };
      // A parent that no longer exists must not hide its children.
      next[String(r.id)] = { ...ex, parentId: ex.parentId && ids.has(ex.parentId) ? ex.parentId : null };
    }
    putExtras(next);
    cache = rows.map((r) => toCategory(r, next[String(r.id)]));
    return cache;
  },

  async create(input: CategoryInput) {
    validate(cache, input, undefined, false);
    const dto = await unwrap(http.post<ApiResponse<RawCategory>>('/admin/categories', {
      name: input.name.trim(), description: input.description.trim(), icon: input.icon, active: input.active,
      sortOrder: nextPublicOrder(cache),
    }));
    const extras = readExtras();
    extras[String(dto.id)] = { parentId: input.parentId, images: input.images, iconUrl: input.iconUrl, createdAt: now() };
    putExtras(extras);
    const created = toCategory(dto, extras[String(dto.id)]);
    cache = [...cache, created];
    audit('create', created, null, created);
    return created;
  },

  async update(id: string, input: CategoryInput) {
    const prev = cache.find((c) => c.id === id);
    validate(cache, input, id, false);
    const moved = !!prev && prev.parentId !== input.parentId;
    const dto = await unwrap(http.patch<ApiResponse<RawCategory>>(`/admin/categories/${id}`, {
      name: input.name.trim(), description: input.description.trim(), icon: input.icon, active: input.active,
      ...(moved ? { sortOrder: nextPublicOrder(cache) } : {}),
    }));
    const extras = readExtras();
    extras[id] = { parentId: input.parentId, images: input.images, iconUrl: input.iconUrl, createdAt: extras[id]?.createdAt ?? now() };
    putExtras(extras);
    const next = toCategory(dto, extras[id]);
    cache = cache.map((c) => (c.id === id ? next : c));
    if (prev) audit(moved ? 'move' : 'update', next, prev, next);
    return next;
  },

  async setActive(ids: string[], active: boolean) {
    const targets = cache.filter((c) => ids.includes(c.id) && c.active !== active);
    await Promise.all(targets.map((c) => http.patch(`/admin/categories/${c.id}`, { active })));
    const changed = targets.map((c) => ({ ...c, active, updatedAt: now() }));
    cache = cache.map((c) => changed.find((n) => n.id === c.id) ?? c);
    targets.forEach((c, i) => audit(active ? 'activate' : 'deactivate', changed[i], c, changed[i]));
    return changed;
  },

  async remove(id: string) {
    const target = cache.find((c) => c.id === id);
    if (target) {
      const kids = cache.filter((c) => c.parentId === id);
      if (kids.length) fail(`“${target.name}” has ${kids.length} sub-categor${kids.length === 1 ? 'y' : 'ies'}. Delete or move them first.`, 'CATEGORY_IN_USE', 409);
    }
    await http.delete(`/admin/categories/${id}`); // backend answers 409 CATEGORY_IN_USE while services exist
    const extras = readExtras();
    delete extras[id];
    putExtras(extras);
    cache = cache.filter((c) => c.id !== id);
    if (target) audit('delete', target, target, null);
  },

  async reorder(items: ReorderItem[]) {
    const byId = new Map(items.map((i) => [i.id, i]));
    // Apply the admin's sibling-level change, then flatten the tree (parent, its children, next parent...)
    // into ONE global sequence. The public site reads a flat list sorted by sortOrder, so the numbers must be
    // unique across parents and sub-categories, otherwise they would interleave.
    const applied = cache.map((c) => {
      const i = byId.get(c.id);
      return i ? { ...c, parentId: i.parentId, sortOrder: i.sortOrder } : c;
    });
    const global = flattenOrder(applied);
    const toSave = applied
      .map((c) => ({ id: c.id, sortOrder: global.get(c.id) ?? c.sortOrder }))
      .filter((n) => n.sortOrder !== cache.find((c) => c.id === n.id)?.sortOrder);
    if (toSave.length) await http.put('/admin/categories/reorder', { items: toSave }); // one request, applied together
    const extras = readExtras();
    const before = cache;
    cache = applied.map((c) => ({ ...c, sortOrder: global.get(c.id) ?? c.sortOrder }));
    cache.forEach((c) => {
      const prev = before.find((b) => b.id === c.id);
      if (!prev || !byId.has(c.id)) return;
      if (extras[c.id]) extras[c.id] = { ...extras[c.id], parentId: c.parentId };
      if (prev.sortOrder !== c.sortOrder || prev.parentId !== c.parentId) {
        audit(prev.parentId !== c.parentId ? 'move' : 'reorder', c, prev, c);
      }
    });
    putExtras(extras);
    return cache;
  },

  async auditLog() { return read<CategoryAuditEntry[]>(AUDIT_KEY, () => []); },
};

// ====================== DEMO: fully local store ======================
function seed(): AdminCategory[] {
  const t = now();
  const mk = (id: string, name: string, slug: string, icon: string, description: string, parentId: string | null, sortOrder: number, services: number, active = true): AdminCategory =>
    toCategory({ id, name, slug, icon, description, parentId, sortOrder, services, active, createdAt: t, updatedAt: t });
  return [
    mk('c1', 'Home Cleaning', 'home-cleaning', '🧹', 'Deep cleaning, bathroom, kitchen, sofa & carpet shampooing', null, 0, 4),
    mk('c1a', 'Bathroom Cleaning', 'bathroom-cleaning', '🚿', 'Tiles, fittings and descaling', 'c1', 0, 3),
    mk('c1b', 'Sofa & Carpet', 'sofa-carpet', '🛋️', 'Shampooing and stain removal', 'c1', 1, 2),
    mk('c2', 'Appliance Repair & Service', 'appliance-repair-service', '🔧', 'AC, washing machine, refrigerator, RO', null, 1, 0),
    mk('c2a', 'AC Service', 'ac-service', '❄️', 'Gas refill, jet wash, installation', 'c2', 0, 5),
    mk('c2b', 'Washing Machine', 'washing-machine', '🧺', 'Front and top-load repair', 'c2', 1, 0, false),
    mk('c3', 'Salon & Spa', 'salon-spa', '💆', 'At-home beauty, massage, and grooming', null, 2, 6),
    mk('c4', 'Electrical & Plumbing', 'electrical-plumbing', '💡', 'Wiring, fixtures, leak repair, fittings', null, 3, 8),
    mk('c5', 'Painting & Waterproofing', 'painting-waterproofing', '🎨', 'Interior/exterior painting, damp-proofing', null, 4, 0, false),
    mk('c6', 'Pest Control', 'pest-control', '🐜', 'General pest, termite, and mosquito treatments', null, 5, 3),
  ];
}
const demoAll = () => read<RawCategory[]>(STORE_KEY, seed).map((r) => toCategory(r));
const demoSave = (all: AdminCategory[]) => { cache = all; write(STORE_KEY, all); };

const demo = {
  async list() { cache = demoAll(); return delay(cache); },

  async create(input: CategoryInput) {
    const all = demoAll();
    validate(all, input);
    const t = now();
    const created = toCategory({
      ...input, name: input.name.trim(), description: input.description.trim(), id: uid(),
      sortOrder: siblings(all, input.parentId).length, services: 0, createdAt: t, updatedAt: t,
    });
    demoSave([...all, created]);
    audit('create', created, null, created);
    return delay(created);
  },

  async update(id: string, input: CategoryInput) {
    const all = demoAll();
    const prev = all.find((c) => c.id === id);
    if (!prev) return fail('Category not found', 'NOT_FOUND', 404);
    validate(all, input, id);
    const moved = prev.parentId !== input.parentId;
    const next: AdminCategory = {
      ...prev, ...input, name: input.name.trim(), description: input.description.trim(), updatedAt: now(),
      sortOrder: moved ? siblings(all, input.parentId).length : prev.sortOrder,
    };
    demoSave(all.map((c) => (c.id === id ? next : c)));
    audit(moved ? 'move' : 'update', next, prev, next);
    return delay(next);
  },

  async setActive(ids: string[], active: boolean) {
    const all = demoAll();
    const changed: AdminCategory[] = [];
    const out = all.map((c) => {
      if (!ids.includes(c.id) || c.active === active) return c;
      const n = { ...c, active, updatedAt: now() };
      changed.push(n);
      audit(active ? 'activate' : 'deactivate', n, c, n);
      return n;
    });
    demoSave(out);
    return delay(changed);
  },

  async remove(id: string) {
    const all = demoAll();
    const target = all.find((c) => c.id === id);
    if (!target) return fail('Category not found', 'NOT_FOUND', 404);
    const kids = all.filter((c) => c.parentId === id);
    if (kids.length) fail(`“${target.name}” has ${kids.length} sub-categor${kids.length === 1 ? 'y' : 'ies'}. Delete or move them first.`, 'CATEGORY_IN_USE', 409);
    if (target.services > 0) fail(inUseMessage(target), 'CATEGORY_IN_USE', 409);
    demoSave(all.filter((c) => c.id !== id));
    audit('delete', target, target, null);
    return delay(undefined);
  },

  async reorder(items: ReorderItem[]) {
    const all = demoAll();
    const byId = new Map(items.map((i) => [i.id, i]));
    const out = all.map((c) => {
      const i = byId.get(c.id);
      if (!i || (i.parentId === c.parentId && i.sortOrder === c.sortOrder)) return c;
      const n = { ...c, parentId: i.parentId, sortOrder: i.sortOrder, updatedAt: now() };
      audit(i.parentId !== c.parentId ? 'move' : 'reorder', n, c, n);
      return n;
    });
    demoSave(out);
    return delay(out);
  },

  async auditLog() { return delay(read<CategoryAuditEntry[]>(AUDIT_KEY, () => [])); },
};

// ====================== public client ======================
/** No HTTP response at all (network down, proxy refused, timeout) or the endpoint is missing / the server is down. */
const backendUnavailable = (e: CategoryApiError) =>
  e.status === undefined || e.status === 404 || e.status === 501 || e.status >= 500;

const impl = () => (mode === 'demo' ? demo : live);
async function run<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch (e) { throw toErr(e); }
}

export const adminCategoryApi = {
  /** Decides live vs demo. Auth errors (401/403) are real errors and are shown, not hidden by demo data. */
  async list(): Promise<AdminCategory[]> {
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
  create: (input: CategoryInput) => run(() => impl().create(input)),
  update: (id: string, input: CategoryInput) => run(() => impl().update(id, input)),
  setActive: (ids: string[], active: boolean) => run(() => impl().setActive(ids, active)),
  remove: (id: string) => run(() => impl().remove(id)),
  reorder: (items: ReorderItem[]) => run(() => impl().reorder(items)),
  auditLog: () => run(() => impl().auditLog()),
  /** Demo mode only: keeps a category's service count in step with the demo services store (the live backend counts itself). */
  adjustDemoServiceCount(id: string, delta: number) {
    if (mode !== 'demo') return;
    demoSave(demoAll().map((c) => (c.id === id ? { ...c, services: Math.max(0, c.services + delta) } : c)));
  },
};

/** Test helper: forget the detected mode and cached rows. */
export function __resetCategoryApiForTests() { mode = 'unknown'; modeReason = ''; cache = []; }