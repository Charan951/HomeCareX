import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link2 } from 'lucide-react';
import { FullScreenPanel } from '@/components/admin/FullScreenPanel';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { AddOnEditor, ChecklistEditor, FaqEditor, StringListEditor } from '@/components/admin/ServiceListEditors';
import { hasErrors, validateService } from '@/lib/serviceValidation';
import { SERVICE_LIMITS as L, type AdminService, type ServiceErrors, type ServiceInput } from '@/types/adminService';

export interface CategoryOption {
  id: string;
  /** Display label, e.g. "Home Cleaning › Bathroom Cleaning". */
  name: string;
  active: boolean;
}

interface Props {
  open: boolean;
  editing: AdminService | null;
  /** Category pre-selected for a new service (e.g. when arriving from a category row). */
  presetCategoryId?: string;
  categories: CategoryOption[];
  saving: boolean;
  /** Message from the last failed save. */
  serverError: string;
  /** Per-field messages from the server or the client validator. */
  serverFields?: ServiceErrors;
  onClose: () => void;
  onSubmit: (input: ServiceInput) => void;
}

const EMPTY: ServiceInput = {
  name: '', categoryId: '', description: '', basePrice: 0, durationMinutes: 60,
  images: [], inclusions: [], exclusions: [], faqs: [], addOns: [], checklist: [], active: true,
};

const fromService = (s: AdminService): ServiceInput => ({
  name: s.name, categoryId: s.categoryId, description: s.description, basePrice: s.basePrice, durationMinutes: s.durationMinutes,
  images: s.images, inclusions: s.inclusions, exclusions: s.exclusions, faqs: s.faqs, addOns: s.addOns, checklist: s.checklist, active: s.active,
});

const numberOrNaN = (v: string) => (v === '' ? Number.NaN : Number(v));

/** Create / edit a service. Validation is shared with the API client (lib/serviceValidation). */
export const ServiceForm: React.FC<Props> = ({ open, editing, presetCategoryId, categories, saving, serverError, serverFields, onClose, onSubmit }) => {
  const [form, setForm] = useState<ServiceInput>(EMPTY);
  const [touched, setTouched] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setForm(editing ? fromService(editing) : { ...EMPTY, categoryId: presetCategoryId ?? '' });
  }, [open, editing, presetCategoryId]);

  const set = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const errors = useMemo(() => validateService(form, categories), [form, categories]);
  // Server messages win until the admin edits the form again.
  const [fromServer, setFromServer] = useState<ServiceErrors>({});
  useEffect(() => setFromServer(serverFields ?? {}), [serverFields]);
  const shown = (k: keyof ServiceInput) => (touched ? errors[k] : undefined) ?? fromServer[k];

  const selectable = categories.filter((c) => c.active || c.id === form.categoryId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFromServer({});
    if (hasErrors(errors)) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });
  };

  const err = (k: keyof ServiceInput) => { const m = shown(k); return m ? <small className="cat-err" role="alert">{m}</small> : null; };

  return (
    <FullScreenPanel
      open={open} onClose={() => !saving && onClose()}
      title={editing ? `Edit ${editing.name}` : 'New service'}
      subtitle={editing ? 'Changes are written to the audit log.' : 'The service appears in the catalog as soon as it is saved as active.'}
      footer={
        <>
          <button type="button" className="hcx-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="service-form" className="hcx-btn hcx-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create service'}
          </button>
        </>
      }
    >
      <form id="service-form" ref={formRef} className="cat-form svc-form-wide" onSubmit={submit} noValidate>
        {serverError && <div role="alert" className="cat-alert">{serverError}</div>}

        <section className="cat-form__sec">
          <h3>Basics</h3>
          <label className="cat-field">
            <span>Name * <small>{form.name.length}/{L.nameMax}</small></span>
            <input value={form.name} maxLength={L.nameMax} autoFocus disabled={saving} placeholder="e.g. Bathroom Deep Cleaning" aria-invalid={Boolean(shown('name'))} onChange={(e) => set('name', e.target.value)} />
            {err('name')}
          </label>

          {editing && (
            <div className="cat-field">
              <span>Slug</span>
              <div className="cat-slug"><Link2 size={15} aria-hidden /><em>/services/</em><input value={editing.slug} readOnly aria-label="Slug (generated by the server, read only)" /></div>
              <small className="cat-hint">Generated from the name and kept stable so booking links keep working.</small>
            </div>
          )}

          <label className="cat-field">
            <span>Category *</span>
            <select value={form.categoryId} disabled={saving} aria-invalid={Boolean(shown('categoryId'))} onChange={(e) => set('categoryId', e.target.value)}>
              <option value="">Select a category…</option>
              {selectable.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inactive)'}</option>)}
            </select>
            {err('categoryId')}
          </label>

          <label className="cat-field">
            <span>Description <small>{form.description.length}/{L.descriptionMax}</small></span>
            <textarea rows={4} maxLength={L.descriptionMax} value={form.description} disabled={saving} placeholder="What the customer gets, in a few sentences" aria-invalid={Boolean(shown('description'))} onChange={(e) => set('description', e.target.value)} />
            {err('description')}
          </label>

          <div className="svc-grid2">
            <label className="cat-field">
              <span>Base price (₹) *</span>
              <input type="number" inputMode="decimal" min={0} step="1" value={Number.isNaN(form.basePrice) ? '' : form.basePrice} disabled={saving} aria-invalid={Boolean(shown('basePrice'))} onChange={(e) => set('basePrice', numberOrNaN(e.target.value))} />
              {err('basePrice')}
            </label>
            <label className="cat-field">
              <span>Duration (minutes) *</span>
              <input type="number" inputMode="numeric" min={L.durationMin} max={L.durationMax} step="5" value={Number.isNaN(form.durationMinutes) ? '' : form.durationMinutes} disabled={saving} aria-invalid={Boolean(shown('durationMinutes'))} onChange={(e) => set('durationMinutes', numberOrNaN(e.target.value))} />
              {err('durationMinutes')}
            </label>
          </div>

          <div className="cat-switchrow">
            <div><strong>{form.active ? 'Active' : 'Inactive'}</strong><small>{form.active ? 'Customers can see and book this service.' : 'Hidden from customers until you turn it on.'}</small></div>
            <button type="button" role="switch" aria-checked={form.active} aria-label="Service active" className={`cat-switch ${form.active ? 'is-on' : ''}`} onClick={() => set('active', !form.active)} disabled={saving}><span /></button>
          </div>
        </section>

        <section className="cat-form__sec">
          <h3>Images <small>the starred image is the cover · drag, or use the arrows, to reorder</small></h3>
          <MultiImageUploader label="Service images" images={form.images} onChange={(imgs) => set('images', imgs)} max={L.images} minEdge={200} disabled={saving} />
          {err('images')}
        </section>

        <StringListEditor title="Inclusions" hint="what is covered" noun="inclusion" items={form.inclusions} onChange={(v) => set('inclusions', v)} max={L.listItems} maxLength={L.listItemMax} placeholder="e.g. Tile and fitting scrubbing" error={shown('inclusions')} disabled={saving} />
        <StringListEditor title="Exclusions" hint="what is not covered" noun="exclusion" items={form.exclusions} onChange={(v) => set('exclusions', v)} max={L.listItems} maxLength={L.listItemMax} placeholder="e.g. Spare parts" error={shown('exclusions')} disabled={saving} />
        <FaqEditor items={form.faqs} onChange={(v) => set('faqs', v)} max={L.faqs} error={shown('faqs')} disabled={saving} />
        <AddOnEditor items={form.addOns} onChange={(v) => set('addOns', v)} max={L.addOns} error={shown('addOns')} disabled={saving} />
        <ChecklistEditor items={form.checklist} onChange={(v) => set('checklist', v)} max={L.checklist} error={shown('checklist')} disabled={saving} />
      </form>
    </FullScreenPanel>
  );
};

export default ServiceForm;
