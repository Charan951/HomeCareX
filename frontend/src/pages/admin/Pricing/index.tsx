import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock, Eye, EyeOff, History, Pencil, Plus, Tag, Trash2, WifiOff, X, XCircle } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FullScreenPanel } from '@/components/admin/FullScreenPanel';
import { AuditDiffDrawer, type AuditEntry } from '@/components/admin/AuditDiffDrawer';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { PermissionGate } from '@/components/admin/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useUIStore } from '@/store/useUIStore';
import { adminCategoryApi } from '@/pages/admin/Services/adminCategoryApi';
import { adminServiceApi } from '@/services/adminServiceApi';
import { adminPricingApi, cityKey, getPricingApiMode, getPricingApiModeReason, type PricingApiError } from '@/services/adminPricingApi';
import type { AdminCategory } from '@/types/adminCatalog';
import type {
  CategoryOption, PricingAuditEntry, PricingFormErrors, PricingRule, PricingRuleInput, ServiceOption,
} from '@/types/adminPricing';
import PricingRuleForm from './PricingRuleForm';
import '../Categories/index.css';
import './index.css';

export const PRICING_MANAGE = 'pricing:manage';

type Toast = { text: string; tone: 'success' | 'error' } | null;
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const duration = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`);

/** "Parent › Child" labels so sub-categories are recognisable in a flat list. */
function toCategoryOptions(cats: AdminCategory[]): CategoryOption[] {
  const byId = new Map(cats.map((c) => [c.id, c]));
  return cats
    .map((c) => ({ id: c.id, name: c.parentId && byId.get(c.parentId) ? `${byId.get(c.parentId)!.name} › ${c.name}` : c.name, active: c.active }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const AdminPricingPage: React.FC = () => {
  const online = useOnlineStatus();
  const { can } = usePermissions();
  const canManage = can(PRICING_MANAGE);

  const [rules, setRules] = useState<PricingRule[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // Search text comes from the search bar below the navbar (same as Services and Manage Partners).
  const search = useUIStore((s) => s.pageSearch);
  const setPageSearch = useUIStore((s) => s.setPageSearch);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<number>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [formFields, setFormFields] = useState<PricingFormErrors | undefined>();

  const [toDelete, setToDelete] = useState<PricingRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [auditOpen, setAuditOpen] = useState(false);
  const [audit, setAudit] = useState<PricingAuditEntry[]>([]);
  const [auditEntry, setAuditEntry] = useState<AuditEntry | null>(null);

  const flash = useCallback((text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 5500);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    try {
      // Categories, then services (each decides its own live/demo mode), then the rules.
      const cats = await adminCategoryApi.list().catch(() => [] as AdminCategory[]);
      const svcs = await adminServiceApi.list().catch(() => []);
      setCategories(toCategoryOptions(cats));
      setServices(svcs.map((s) => ({ id: s.id, name: s.name, categoryId: s.categoryId, basePrice: s.basePrice, durationMinutes: s.durationMinutes })));
      setRules(await adminPricingApi.list());
      setLoadError('');
    } catch (e) {
      setLoadError((e as PricingApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // ---- names for the table ----
  const categoryName = useCallback((id: string) => categories.find((c) => c.id === id)?.name ?? 'Unknown category', [categories]);
  const serviceName = useCallback((id: string | null) => (id === null ? 'All services' : services.find((s) => s.id === id)?.name ?? 'Unknown service'), [services]);
  const labelFor = useCallback((r: { categoryId: string; serviceId: string | null; city: string }) =>
    `${r.serviceId ? serviceName(r.serviceId) : `${categoryName(r.categoryId)} (all services)`} · ${r.city || 'All cities'}`, [categoryName, serviceName]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return rules;
    return rules.filter((r) => [serviceName(r.serviceId), categoryName(r.categoryId), r.city || 'all cities', r.mode].some((v) => v.toLowerCase().includes(needle)));
  }, [rules, search, serviceName, categoryName]);

  const stats = useMemo(() => ({
    total: rules.length, active: rules.filter((r) => r.active).length, inactive: rules.filter((r) => !r.active).length,
  }), [rules]);
  const cities = useMemo(() => {
    const byKey = new Map<string, string>();
    rules.forEach((r) => { if (r.city && !byKey.has(cityKey(r.city))) byKey.set(cityKey(r.city), r.city); });
    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
  }, [rules]);

  // ---- actions ----
  const openCreate = () => { setEditing(null); setFormError(''); setFormFields(undefined); setFormOpen(true); };
  const openEdit = (r: PricingRule) => { setEditing(r); setFormError(''); setFormFields(undefined); setFormOpen(true); };

  async function save(input: PricingRuleInput) {
    setSaving(true); setFormError(''); setFormFields(undefined);
    try {
      const saved = await adminPricingApi.save(input, labelFor(input));
      setFormOpen(false);
      await load();
      flash(`Pricing rule for “${labelFor(saved)}” ${editing ? 'updated' : 'created'}`);
    } catch (e) {
      const err = e as PricingApiError;
      setFormError(err.message);
      setFormFields(err.fields);
    } finally { setSaving(false); }
  }

  async function toggle(r: PricingRule) {
    const next = !r.active;
    setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: next } : x)));
    setBusyIds((b) => new Set(b).add(r.id));
    try {
      await adminPricingApi.setActive(r, next, labelFor(r));
      flash(`Rule for “${labelFor(r)}” ${next ? 'activated' : 'deactivated'}`);
    } catch (e) {
      setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: r.active } : x)));
      flash((e as PricingApiError).message, 'error');
    } finally {
      setBusyIds((b) => { const n = new Set(b); n.delete(r.id); return n; });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminPricingApi.remove(toDelete, labelFor(toDelete));
      flash(`Rule for “${labelFor(toDelete)}” removed`);
      setToDelete(null);
      await load();
    } catch (e) {
      flash((e as PricingApiError).message, 'error');
      setToDelete(null);
    } finally { setDeleting(false); }
  }

  async function openAudit() {
    setAuditOpen(true);
    try { setAudit(await adminPricingApi.auditLog()); } catch { setAudit([]); }
  }

  const mode = getPricingApiMode();
  const noCatalog = !loading && categories.length === 0;

  return (
    <div className="admin-page-container cat-page svc-page prc-page">
      <PageHeader
        title="Pricing"
        description="Price rules per category or service: fixed or hourly price, add-ons, surge windows, cancellation fee and city-specific overrides."
        actions={
          <div className="cat-head-actions">
            <button type="button" className="hcx-btn" onClick={() => void openAudit()}><History size={16} /> Audit log</button>
            <PermissionGate permission={PRICING_MANAGE}>
              <button type="button" className="hcx-btn hcx-btn--primary" onClick={openCreate} disabled={!online || loading || noCatalog}><Plus size={16} /> Create rule</button>
            </PermissionGate>
          </div>
        }
      />

      {!online && <div className="cat-banner" role="status"><WifiOff size={15} /> You are offline. You can browse what has loaded, but changes are disabled until the connection returns.</div>}
      {mode === 'demo' && <div className="cat-banner" role="status"><WifiOff size={15} /> Backend not reachable ({getPricingApiModeReason()}): showing local demo data. Changes are saved in this browser only.</div>}
      {!canManage && <div className="cat-banner cat-banner--info" role="status">You can view pricing but need the “{PRICING_MANAGE}” permission to change it.</div>}
      {noCatalog && !loadError && <div className="cat-banner cat-banner--info" role="status">Create a category and a service first, then come back to set pricing.</div>}

      {toast && (
        <div role="status" className={clsx('cat-toast', toast.tone === 'error' && 'is-error')}>
          {toast.tone === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}<span>{toast.text}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <div className="cat-stats">
        <div className="cat-stat"><span className="cat-stat__i is-brand"><Tag size={18} /></span><div><b>{stats.total}</b><small>Total rules</small></div></div>
        <div className="cat-stat"><span className="cat-stat__i is-ok"><Eye size={18} /></span><div><b>{stats.active}</b><small>Active</small></div></div>
        <div className="cat-stat"><span className="cat-stat__i is-off"><EyeOff size={18} /></span><div><b>{stats.inactive}</b><small>Inactive</small></div></div>
      </div>

      <p className="svc-count-note">{visible.length} of {rules.length} rules</p>

      {loadError && <div role="alert" className="cat-alert">{loadError} <button type="button" className="hcx-btn" onClick={() => { setLoading(true); void load(); }}>Retry</button></div>}

      {loading ? (
        <div className="cat-skel" aria-label="Loading pricing rules">{[0, 1, 2, 3].map((n) => <span key={n} className="hcx-skeleton hcx-skeleton--block" style={{ height: 56 }} />)}</div>
      ) : visible.length === 0 ? (
        <div className="cat-empty">
          <Tag size={34} aria-hidden />
          <h3>{rules.length === 0 ? 'No pricing rules yet' : 'No rules match your search'}</h3>
          <p>{rules.length === 0 ? 'Create a rule to set the price, add-ons and surge windows for a category or service.' : 'Try a different search.'}</p>
          {rules.length === 0
            ? <PermissionGate permission={PRICING_MANAGE}><button type="button" className="hcx-btn hcx-btn--primary" onClick={openCreate} disabled={!online || noCatalog}><Plus size={16} /> Create rule</button></PermissionGate>
            : <button type="button" className="hcx-btn" onClick={() => setPageSearch('')}>Clear search</button>}
        </div>
      ) : (
        <div className="hcx-table-card">
          <div className="hcx-table-scroll">
            <table className="hcx-table prc-table" aria-label="Pricing rules">
              <thead>
                <tr>
                  <th scope="col">Service / category</th>
                  <th scope="col">City</th>
                  <th scope="col">Price</th>
                  <th scope="col" className="hcx-hide-sm">Duration</th>
                  <th scope="col" className="hcx-hide-sm">Add-ons</th>
                  <th scope="col" className="hcx-hide-sm">Surge</th>
                  <th scope="col" className="hcx-hide-sm">Cancel fee</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="prc-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const busy = busyIds.has(r.id);
                  const name = labelFor(r);
                  return (
                    <tr key={r.id} className={clsx(!r.active && 'is-inactive', busy && 'is-busy')}>
                      <td className="prc-td-scope">
                        <div className="prc-scope">
                          <strong>{serviceName(r.serviceId)}</strong>
                          <small>{categoryName(r.categoryId)}</small>
                        </div>
                      </td>
                      <td data-label="City">{r.city || <span className="prc-muted">All cities</span>}</td>
                      <td data-label="Price">
                        <b className="prc-price">{rupees(r.basePrice)}</b>
                        <span className={clsx('prc-mode', r.mode === 'HOURLY' && 'is-hourly')}>{r.mode === 'HOURLY' ? 'per hour' : 'fixed'}</span>
                      </td>
                      <td className="hcx-hide-sm" data-label="Duration"><span className="prc-dur"><Clock size={12} aria-hidden /> {duration(r.durationMinutes)}</span></td>
                      <td className="hcx-hide-sm" data-label="Add-ons">{r.addOns.length || <span className="prc-muted">—</span>}</td>
                      <td className="hcx-hide-sm" data-label="Surge windows">{r.surgeWindows.length || <span className="prc-muted">—</span>}</td>
                      <td className="hcx-hide-sm" data-label="Cancellation fee">{rupees(r.cancellationFee)}</td>
                      <td data-label="Status">
                        <div className="prc-status">
                          <button
                            type="button" role="switch" aria-checked={r.active} aria-label={`Rule for ${name} is ${r.active ? 'active' : 'inactive'}`}
                            className={clsx('cat-switch', r.active && 'is-on')} disabled={!canManage || !online || busy} onClick={() => void toggle(r)}
                          ><span /></button>
                          <StatusBadge status={r.active ? 'Active' : 'Inactive'} tone={r.active ? 'success' : 'neutral'} />
                        </div>
                      </td>
                      <td className="prc-td-actions">
                        <div className="prc-actions">
                          <PermissionGate permission={PRICING_MANAGE}>
                            <button type="button" className="cat-iconbtn" onClick={() => openEdit(r)} disabled={!online} aria-label={`Edit rule for ${name}`} title="Edit"><Pencil size={16} /></button>
                            <button type="button" className="cat-iconbtn cat-iconbtn--danger" onClick={() => setToDelete(r)} disabled={!online} aria-label={`Remove rule for ${name}`} title="Remove"><Trash2 size={16} /></button>
                          </PermissionGate>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PricingRuleForm
        open={formOpen} editing={editing} categories={categories} services={services} rules={rules} cities={cities}
        saving={saving} serverError={formError} serverFields={formFields}
        onClose={() => setFormOpen(false)} onSubmit={(i) => void save(i)}
      />

      <ConfirmDialog
        open={!!toDelete} tone="danger" loading={deleting} title="Remove pricing rule?" confirmLabel="Remove"
        message={<>The rule for “{toDelete ? labelFor(toDelete) : ''}” will be removed and recorded in the audit log. Customers will then be quoted by the next most specific rule, or the service’s own price.</>}
        onCancel={() => setToDelete(null)} onConfirm={() => void confirmDelete()}
      />

      <FullScreenPanel open={auditOpen} onClose={() => setAuditOpen(false)} title="Pricing audit log" subtitle="Every create, edit, status change and removal, with before and after values. Recorded in this browser until the backend has an audit write endpoint.">
        {audit.length === 0 ? <p className="cat-note">No activity yet.</p> : (
          <ul className="cat-audit">
            {audit.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setAuditEntry({
                  id: a.id, actor: a.actor, action: a.action, entity: `Pricing rule · ${a.entityName}`, entityId: a.entityId,
                  time: new Date(a.time).toLocaleString(), before: a.before, after: a.after,
                })}>
                  <StatusBadge status={a.action} tone={a.action === 'delete' ? 'danger' : a.action === 'create' ? 'success' : 'info'} dot={false} />
                  <span className="cat-audit__n">{a.entityName}</span>
                  <small>{new Date(a.time).toLocaleString()}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </FullScreenPanel>
      <AuditDiffDrawer entry={auditEntry} onClose={() => setAuditEntry(null)} />
    </div>
  );
};

export default AdminPricingPage;
