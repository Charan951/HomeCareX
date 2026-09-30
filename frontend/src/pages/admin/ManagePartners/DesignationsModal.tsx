import React, { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Modal } from '@/components/admin/Modal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { adminApi, type Designation } from '../Services/adminApi';
import type { ApiError } from '@/lib/http';

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400';

interface Props {
  open: boolean;
  designations: Designation[];
  onClose: () => void;
  /** Called after any add / rename / delete so the parent can reload designations and partners. */
  onChanged: () => void;
}

const errText = (e: unknown) => {
  const err = e as ApiError;
  return err.details?.[0]?.message || err.message || 'Something went wrong';
};

export const DesignationsModal: React.FC<Props> = ({ open, designations, onClose, onChanged }) => {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [toDelete, setToDelete] = useState<Designation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(action: () => Promise<unknown>, after?: () => void) {
    setBusy(true);
    setError('');
    try {
      await action();
      after?.();
      onChanged();
    } catch (e) {
      setError(errText(e));
      setToDelete(null); // so a failed delete shows its reason in the list dialog
    } finally {
      setBusy(false);
    }
  }

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    void run(() => adminApi.createDesignation(newName.trim()), () => setNewName(''));
  };

  const saveEdit = (d: Designation) => {
    if (!editName.trim() || editName.trim() === d.name) return setEditingId(null);
    void run(() => adminApi.renameDesignation(d.id, editName.trim()), () => setEditingId(null));
  };

  const close = () => {
    if (busy) return;
    setEditingId(null);
    setError('');
    setNewName('');
    onClose();
  };

  return (
    <>
      <Modal
        open={open && !toDelete}
        onClose={close}
        title="Designations"
        description="The specialist types partners can be registered under."
        dismissible={!busy}
        footer={
          <button type="button" className="hcx-btn" onClick={close} disabled={busy}>
            Done
          </button>
        }
      >
        <form onSubmit={add} className="mb-4 flex gap-2">
          <input
            className={inputClass}
            placeholder="New designation, e.g. Carpenter"
            value={newName}
            maxLength={40}
            onChange={(e) => setNewName(e.target.value)}
            aria-label="New designation name"
          />
          <button type="submit" className="hcx-btn hcx-btn--primary" disabled={busy || !newName.trim()}>
            <Plus size={16} /> Add
          </button>
        </form>

        {error && (
          <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {designations.length === 0 && <li className="px-3 py-4 text-sm text-gray-500">No designations yet. Add one above.</li>}
          {designations.map((d) => (
            <li key={d.id} className="flex items-center gap-2 px-3 py-2">
              {editingId === d.id ? (
                <>
                  <input
                    className={inputClass}
                    value={editName}
                    maxLength={40}
                    autoFocus
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(d);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    aria-label={`Rename ${d.name}`}
                  />
                  <button type="button" className="hcx-btn hcx-btn--primary" onClick={() => saveEdit(d)} disabled={busy} aria-label="Save name">
                    <Check size={16} />
                  </button>
                  <button type="button" className="hcx-btn" onClick={() => setEditingId(null)} disabled={busy} aria-label="Cancel rename">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{d.name}</span>
                  <span className="text-xs text-gray-500">
                    {d.partners} partner{d.partners === 1 ? '' : 's'}
                  </span>
                  <button
                    type="button"
                    className="hcx-btn hcx-btn--ghost"
                    onClick={() => {
                      setEditingId(d.id);
                      setEditName(d.name);
                      setError('');
                    }}
                    disabled={busy}
                    aria-label={`Edit ${d.name}`}
                    title="Edit"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="hcx-btn hcx-btn--ghost hcx-btn--danger-ghost"
                    onClick={() => {
                      setError('');
                      setToDelete(d);
                    }}
                    disabled={busy}
                    aria-label={`Remove ${d.name}`}
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        tone="danger"
        title="Remove designation"
        message={`Remove “${toDelete?.name}”? This can't be undone. Designations that still have partners can't be removed.`}
        confirmLabel="Remove"
        loading={busy}
        onCancel={() => setToDelete(null)}
        onConfirm={() => {
          if (!toDelete) return;
          void run(() => adminApi.deleteDesignation(toDelete.id), () => setToDelete(null));
        }}
      />
    </>
  );
};

export default DesignationsModal;
