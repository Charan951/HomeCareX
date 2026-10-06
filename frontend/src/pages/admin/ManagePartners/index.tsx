import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useUIStore } from '@/store/useUIStore';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { adminApi, type Designation, type PartnerMember } from '../Services/adminApi'
import type { ApiError } from '@/lib/http';
import { PartnerFormModal } from './PartnerFormModal';
import { DesignationsModal } from './DesignationsModal';

import './index.css';

type Notice = { text: string; tone: 'success' | 'warning' } | null;

const NOTICE_CLASS = {
  success: 'border-green-200 bg-green-50 text-green-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
} as const;

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export const AdminManagePartnersPage: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [partners, setPartners] = useState<PartnerMember[]>([]);
  // Search text comes from the search bar below the header
  const search = useUIStore((state) => state.pageSearch);
  const visiblePartners = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return partners;
    return partners.filter((p) =>
      [p.name, p.designation, p.email, p.phone].some((v) => (v ?? '').toLowerCase().includes(needle)),
    );
  }, [partners, search]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PartnerMember | null>(null);
  const [designationsOpen, setDesignationsOpen] = useState(false);

  const [toRemove, setToRemove] = useState<PartnerMember | null>(null);
  const [removing, setRemoving] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [p, d] = await Promise.all([adminApi.listPartners(), adminApi.listDesignations()]);
      setPartners(p);
      setDesignations(d);
      setLoadError('');
    } catch (e) {
      setLoadError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: PartnerMember) => {
    setEditing(p);
    setFormOpen(true);
  };

  async function confirmRemove() {
    if (!toRemove) return;
    setRemoving(true);
    try {
      await adminApi.deletePartner(toRemove.id);
      setNotice({ text: `${toRemove.name} was removed.`, tone: 'success' });
      setToRemove(null);
      void loadAll();
    } catch (e) {
      setNotice({ text: (e as ApiError).message, tone: 'warning' });
      setToRemove(null);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="admin-page-container mp-page">
      <PageHeader
        title="Manage Partners"
        description="Register partners, edit their details and manage the designation list."
        actions={
          <div className="flex gap-2 mp-actions">
            <button type="button" className="hcx-btn" onClick={() => setDesignationsOpen(true)}>
              <ListChecks size={16} /> Designations
            </button>
            <button type="button" className="hcx-btn hcx-btn--primary" onClick={openAdd}>
              <Plus size={16} /> Add Partner
            </button>
          </div>
        }
      />

      {notice && (
        <div role="status" className={`mb-4 rounded-lg border px-3 py-2 text-sm ${NOTICE_CLASS[notice.tone]}`}>
          {notice.text}
        </div>
      )}
      {loadError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {loadError}
        </div>
      )}

      {isMobile ? (
        loading ? (
          <ul className="mp-list" aria-label="Loading partners">
            {[0, 1, 2].map((n) => <li key={n} className="mp-card"><span className="hcx-skeleton hcx-skeleton--block" style={{ height: 92 }} /></li>)}
          </ul>
        ) : visiblePartners.length === 0 ? (
          <div className="mp-state">
            {partners.length === 0
              ? 'No partners yet. Tap “Add Partner” to register one.'
              : 'No partners match your search.'}
          </div>
        ) : (
          <ul className="mp-list" aria-label="Partners">
            {visiblePartners.map((s) => (
              <li key={s.id} className="mp-card">
                <div className="mp-card__head">
                  <span className="mp-avatar" aria-hidden>{initials(s.name)}</span>
                  <div className="mp-card__who">
                    <span className="mp-card__name">{s.name}</span>
                    <span className="mp-card__role">{s.designation ?? 'No designation'}</span>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
                <dl className="mp-info">
                  <div><dt>Email</dt><dd>{s.email}</dd></div>
                  <div><dt>Phone</dt><dd>{s.phone ?? '—'}</dd></div>
                  <div><dt>Gender</dt><dd style={{ textTransform: 'capitalize' }}>{s.gender ?? '—'}</dd></div>
                </dl>
                <div className="mp-card__actions">
                  <button type="button" className="hcx-btn" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`}>
                    <Pencil size={15} /> Edit
                  </button>
                  <button type="button" className="hcx-btn hcx-btn--danger-ghost" onClick={() => setToRemove(s)} aria-label={`Remove ${s.name}`}>
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : (
      <div className="hcx-table-card">
          <div className="hcx-table-scroll">
            <table className="hcx-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6}>Loading…</td></tr>
                ) : visiblePartners.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      {partners.length === 0
                        ? 'No partners yet. Click “Add Partner” to register one.'
                        : 'No partners match your search.'}
                    </td>
                  </tr>
                ) : (
                  visiblePartners.map((s) => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.designation ?? '—'}</td>
                      <td>{s.email}</td>
                      <td>{s.phone ?? '—'}</td>
                      <td style={{ textTransform: 'capitalize' }}>{s.gender ?? '—'}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={s.status} />
                          <button type="button" className="hcx-btn hcx-btn--ghost" style={{ minHeight: 30, padding: '4px 8px' }} onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`} title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            className="hcx-btn hcx-btn--ghost hcx-btn--danger-ghost"
                            style={{ minHeight: 30, padding: '4px 8px' }}
                            onClick={() => setToRemove(s)}
                            aria-label={`Remove ${s.name}`}
                            title="Remove"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PartnerFormModal
        open={formOpen}
        suspended={designationsOpen}
        partner={editing}
        designations={designations}
        onClose={() => setFormOpen(false)}
        onManageDesignations={() => setDesignationsOpen(true)}
        onSaved={(text, tone) => {
          setFormOpen(false);
          setNotice({ text, tone });
          void loadAll();
        }}
      />

      <DesignationsModal
        open={designationsOpen}
        designations={designations}
        onClose={() => setDesignationsOpen(false)}
        onChanged={() => void loadAll()}
      />

      <ConfirmDialog
        open={Boolean(toRemove)}
        tone="danger"
        title="Remove partner"
        message={
          <>
            Permanently remove <strong>{toRemove?.name}</strong> ({toRemove?.email})? They will no longer be able to sign in. Partners with booking
            history can't be removed, so block them instead.
          </>
        }
        confirmLabel="Remove partner"
        loading={removing}
        onCancel={() => setToRemove(null)}
        onConfirm={() => void confirmRemove()}
      />
    </div>
  );
};

export default AdminManagePartnersPage;