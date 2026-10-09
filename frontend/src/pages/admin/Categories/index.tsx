import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, Eye, EyeOff, FolderTree, Layers, Plus, X, XCircle, History, WifiOff,
} from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { FullScreenPanel } from '@/components/admin/FullScreenPanel';
import { AuditDiffDrawer, type AuditEntry } from '@/components/admin/AuditDiffDrawer';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CategoryExplorer } from '@/components/admin/CategoryExplorer';
import { useUIStore } from '@/store/useUIStore';
import { adminServiceApi } from '@/services/adminServiceApi';
import type { AdminService } from '@/types/adminService';
import { adminCategoryApi, getApiMode, getApiModeReason, type CategoryApiError } from '../Services/adminCategoryApi';
import type { AdminCategory, CategoryAuditEntry, CategoryInput, ReorderItem } from '@/types/adminCatalog';
import { CategoryFormDrawer } from './CategoryFormDrawer';
import './index.css';

type Toast = { text: string; tone: 'success' | 'error' } | null;

export const AdminCategoriesPage: React.FC = () => {
  const [items, setItems] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<number>();

  // Search text comes from the search bar below the navbar (same as Manage Partners).
  const search = useUIStore((state) => state.pageSearch);
  const setPageSearch = useUIStore((state) => state.setPageSearch);
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesStatus, setServicesStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [presetParent, setPresetParent] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [toDelete, setToDelete] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [audit, setAudit] = useState<CategoryAuditEntry[]>([]);
  const [auditEntry, setAuditEntry] = useState<AuditEntry | null>(null);

  const flash = useCallback((text: string, tone: 'success' | 'error' = 'success') => {
    setToast({ text, tone });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4500);
  }, []);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const load = useCallback(async () => {
    try {
      setItems(await adminCategoryApi.list());
      setLoadError('');
    } catch (e) {
      setLoadError((e as CategoryApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Services are fetched the first time a category is opened, not on page load.
  const servicesRequested = useRef(false);
  const ensureServices = useCallback(() => {
    if (servicesRequested.current) return;
    servicesRequested.current = true;
    setServicesStatus('loading');
    adminServiceApi.list()
      .then((list) => setServices(list))
      .catch(() => setServices([]))
      .finally(() => setServicesStatus('ready'));
  }, []);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((c) => c.active).length,
    inactive: items.filter((c) => !c.active).length,
    subs: items.filter((c) => c.parentId).length,
  }), [items]);

  // ---- actions ----
  const openCreate = (parentId: string | null = null) => { setEditing(null); setPresetParent(parentId); setFormError(''); setFormOpen(true); };
  const openEdit = (c: AdminCategory) => { setEditing(c); setPresetParent(null); setFormError(''); setFormOpen(true); };

  async function save(input: CategoryInput) {
    setSaving(true); setFormError('');
    try {
      if (editing) await adminCategoryApi.update(editing.id, input);
      else await adminCategoryApi.create(input);
      setFormOpen(false);
      flash(editing ? `“${input.name}” updated` : `“${input.name}” created`);
      await load();
    } catch (e) {
      setFormError((e as CategoryApiError).message);
    } finally { setSaving(false); }
  }

  async function toggle(c: AdminCategory) {
    const next = !c.active;
    setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: next } : x)));
    setBusyIds((s) => new Set(s).add(c.id));
    try {
      await adminCategoryApi.setActive([c.id], next);
      flash(`“${c.name}” ${next ? 'activated' : 'deactivated'}`);
    } catch (e) {
      setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: c.active } : x)));
      flash((e as CategoryApiError).message, 'error');
    } finally {
      setBusyIds((s) => { const n = new Set(s); n.delete(c.id); return n; });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await adminCategoryApi.remove(toDelete.id);
      flash(`“${toDelete.name}” deleted`);
      setToDelete(null);
      await load();
    } catch (e) {
      flash((e as CategoryApiError).message, 'error');
      setToDelete(null);
    } finally { setDeleting(false); }
  }

  async function reorder(next: ReorderItem[]) {
    const prev = items;
    const map = new Map(next.map((n) => [n.id, n]));
    setItems((cur) => cur.map((c) => (map.has(c.id) ? { ...c, sortOrder: map.get(c.id)!.sortOrder, parentId: map.get(c.id)!.parentId } : c)));
    try {
      await adminCategoryApi.reorder(next);
      flash('Order saved');
    } catch (e) {
      setItems(prev);
      flash(`Reorder failed: ${(e as CategoryApiError).message}`, 'error');
    }
  }

  async function openAudit() {
    setAuditOpen(true);
    try { setAudit(await adminCategoryApi.auditLog()); } catch { setAudit([]); }
  }


  const deleteBlockedMsg = toDelete
    ? items.some((c) => c.parentId === toDelete.id)
      ? 'This category has sub-categories. Delete or move them first.'
      : toDelete.services > 0
        ? `${toDelete.services} service${toDelete.services === 1 ? ' is' : 's are'} still in this category. Move or delete them first, or deactivate it instead.`
        : ''
    : '';

  return (
    <div className="admin-page-container cat-page">
      <PageHeader
        title="Categories"
        description="Open a category to see its sub-categories, then a sub-category to see its services. Use the switch to show or hide a category for customers; drag to reorder."
        actions={
          <div className="cat-head-actions">
            <button type="button" className="hcx-btn" onClick={() => void openAudit()}><History size={16} /> Audit log</button>
            <button type="button" className="hcx-btn hcx-btn--primary" onClick={() => openCreate()}><Plus size={16} /> New category</button>
          </div>
        }
      />

      {getApiMode() === 'demo' && (
        <div className="cat-banner" role="status"><WifiOff size={15} /> Backend not reachable ({getApiModeReason()}): showing local demo data. Changes are saved in this browser only.</div>
      )}
     
      {toast && (
        <div role="status" className={clsx('cat-toast', toast.tone === 'error' && 'is-error')}>
          {toast.tone === 'error' ? <XCircle size={16} /> : <CheckCircle2 size={16} />}<span>{toast.text}</span>
          <button type="button" aria-label="Dismiss" onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      <div className="cat-stats">
        <div className="cat-stat"><span className="cat-stat__i is-brand"><FolderTree size={18} /></span><div><b>{stats.total}</b><small>Total</small></div></div>
        <div className="cat-stat"><span className="cat-stat__i is-ok"><Eye size={18} /></span><div><b>{stats.active}</b><small>Active</small></div></div>
        <div className="cat-stat"><span className="cat-stat__i is-off"><EyeOff size={18} /></span><div><b>{stats.inactive}</b><small>Inactive</small></div></div>
        <div className="cat-stat"><span className="cat-stat__i is-info"><Layers size={18} /></span><div><b>{stats.subs}</b><small>Sub-categories</small></div></div>
      </div>

      {loadError && <div role="alert" className="cat-alert">{loadError} <button type="button" className="hcx-btn" onClick={() => { setLoading(true); void load(); }}>Retry</button></div>}

      {loading ? (
        <div className="cat-skel" aria-label="Loading categories">{[0, 1, 2, 3, 4].map((n) => <span key={n} className="hcx-skeleton hcx-skeleton--block" style={{ height: 62 }} />)}</div>
      ) : items.length === 0 ? (
        <div className="cat-empty">
          <FolderTree size={34} />
          <h3>No categories yet</h3>
          <p>Create your first category to start organising services.</p>
          <button type="button" className="hcx-btn hcx-btn--primary" onClick={() => openCreate()}><Plus size={16} /> New category</button>
        </div>
      ) : (
        <CategoryExplorer
          items={items} services={services} servicesStatus={servicesStatus} search={search} busyIds={busyIds}
          onNeedServices={ensureServices} onClearSearch={() => setPageSearch('')}
          onEdit={openEdit} onDelete={setToDelete}
          onToggle={(c) => void toggle(c)} onAddChild={(p) => openCreate(p.id)} onReorder={(n) => void reorder(n)}
        />
      )}

      <CategoryFormDrawer
        open={formOpen} editing={editing} presetParentId={presetParent} all={items}
        saving={saving} serverError={formError} slugEditable={getApiMode() !== 'live'} onClose={() => setFormOpen(false)} onSubmit={(i) => void save(i)}
      />

      <ConfirmDialog
        open={!!toDelete} tone="danger" loading={deleting}
        title={deleteBlockedMsg ? 'Cannot delete category' : 'Delete category?'}
        confirmLabel={deleteBlockedMsg ? 'Understood' : 'Delete'}
        cancelLabel="Close"
        message={deleteBlockedMsg ? <>{deleteBlockedMsg}</> : <>“{toDelete?.name}” will be permanently removed. This is recorded in the audit log.</>}
        onCancel={() => setToDelete(null)}
        onConfirm={() => (deleteBlockedMsg ? setToDelete(null) : void confirmDelete())}
      />

      <FullScreenPanel open={auditOpen} onClose={() => setAuditOpen(false)} title="Category audit log" subtitle={getApiMode() === 'live' ? 'Recorded in this browser until the backend has an audit endpoint.' : 'Every create, edit, status change, move and reorder.'}>
        {audit.length === 0 ? <p className="cat-note">No activity yet.</p> : (
          <ul className="cat-audit">
            {audit.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setAuditEntry({
                  id: a.id, actor: a.actor, action: a.action, entity: `Category · ${a.entityName}`, entityId: a.entityId,
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

export default AdminCategoriesPage;
