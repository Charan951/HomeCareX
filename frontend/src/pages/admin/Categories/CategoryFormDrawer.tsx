import React, { useEffect, useMemo, useState } from 'react';
import { FolderTree, ImageIcon, Link2, Lock, Unlock } from 'lucide-react';
import { Drawer } from '@/components/admin/Drawer';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { MultiImageUploader } from '@/components/admin/MultiImageUploader';
import { fileToDataUrl } from '@/lib/imageFile';
import { slugError, slugify } from '@/lib/slug';
import type { AdminCategory, CategoryInput } from '@/types/adminCatalog';

interface Props {
  open: boolean;
  editing: AdminCategory | null;
  /** Pre-selected parent when "Add sub-category" was used. */
  presetParentId?: string | null;
  all: AdminCategory[];
  saving: boolean;
  serverError: string;
  /** false when the backend generates slugs itself (live API today). */
  slugEditable: boolean;
  onClose: () => void;
  onSubmit: (input: CategoryInput) => void;
}

const EMPTY: CategoryInput = { name: '', slug: '', parentId: null, description: '', icon: '', images: [], active: true };

export const CategoryFormDrawer: React.FC<Props> = ({ open, editing, presetParentId, all, saving, serverError, slugEditable, onClose, onSubmit }) => {
  const [form, setForm] = useState<CategoryInput>(EMPTY);
  const [slugLocked, setSlugLocked] = useState(true); // true = follow the name
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setIconFile(null);
    if (editing) {
      const { name, slug, parentId, description, icon, iconUrl, images, active } = editing;
      setForm({ name, slug, parentId, description, icon, iconUrl, images, active });
      setSlugLocked(false); // never rewrite a live slug by accident
    } else {
      setForm({ ...EMPTY, parentId: presetParentId ?? null });
      setSlugLocked(true);
    }
  }, [open, editing, presetParentId]);

  const coverUrl = (form.images.find((i) => i.isPrimary) ?? form.images[0])?.url;
  const hasChildren = useMemo(() => !!editing && all.some((c) => c.parentId === editing.id), [all, editing]);
  const parents = useMemo(() => all.filter((c) => !c.parentId && c.id !== editing?.id).sort((a, b) => a.sortOrder - b.sortOrder), [all, editing]);

  const set = <K extends keyof CategoryInput>(k: K, v: CategoryInput[K]) => setForm((f) => ({ ...f, [k]: v }));
  const nameErr = form.name.trim().length < 2 ? 'Name must be at least 2 characters' : form.name.length > 60 ? 'Max 60 characters' : '';
  const slugErr = slugEditable ? slugError(form.slug) : '';
  const dupSlug = slugEditable && all.some((c) => c.id !== editing?.id && c.slug === form.slug);
  const valid = !nameErr && !slugErr && !dupSlug;

  async function pickIcon(file: File | null) {
    setIconFile(file);
    set('iconUrl', file ? await fileToDataUrl(file, 256) : undefined);
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (valid) onSubmit({ ...form, name: form.name.trim(), description: form.description.trim() });
  };

  return (
    <Drawer
      open={open} onClose={() => !saving && onClose()} width="lg"
      title={editing ? `Edit ${editing.name}` : presetParentId ? 'New sub-category' : 'New category'}
      subtitle={editing ? 'Changes are written to the audit log.' : 'Create a parent category or nest it under one.'}
      footer={
        <>
          <button type="button" className="hcx-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="category-form" className="hcx-btn hcx-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
          </button>
        </>
      }
    >
      <form id="category-form" className="cat-form" onSubmit={submit} noValidate>
        {serverError && <div role="alert" className="cat-alert">{serverError}</div>}

        <div className="cat-preview" aria-label="Preview">
          <span className="cat-preview__label">Preview</span>
          <div className={`cat-preview__card ${form.active ? '' : 'is-off'}`}>
            <div className="cat-preview__cover">
              {coverUrl ? <img src={coverUrl} alt="Cover preview" /> : <span><ImageIcon size={22} />No cover image</span>}
              <span className="cat-preview__icon">
                {form.iconUrl ? <img src={form.iconUrl} alt="Icon preview" /> : <FolderTree size={16} />}
              </span>
              <span className={`cat-preview__state ${form.active ? 'is-on' : ''}`}>{form.active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="cat-preview__text">
              <strong>{form.name.trim() || 'Category name'}</strong>
              <small>{form.description.trim() || 'Description shown to customers'}</small>
            </div>
          </div>
        </div>

        <section className="cat-form__sec">
          <h3>Basics</h3>
          <label className="cat-field">
            <span>Name *</span>
            <input
              value={form.name} maxLength={60} autoFocus placeholder="e.g. Home Cleaning" disabled={saving}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugLocked ? slugify(e.target.value) : f.slug }))}
            />
            {touched && nameErr && <small className="cat-err">{nameErr}</small>}
          </label>

          <label className="cat-field">
            <span>Slug *</span>
            <div className="cat-slug">
              <Link2 size={15} aria-hidden />
              <em>/services/</em>
              <input
                value={form.slug} maxLength={80} disabled={saving} readOnly={!slugEditable}
                onChange={(e) => { setSlugLocked(false); set('slug', e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                onBlur={() => set('slug', slugify(form.slug))}
              />
              {slugEditable && <button
                type="button" className="cat-iconbtn" aria-pressed={slugLocked} disabled={saving}
                title={slugLocked ? 'Slug follows the name' : 'Slug is custom: click to follow the name again'}
                onClick={() => { if (!slugLocked) set('slug', slugify(form.name)); setSlugLocked((v) => !v); }}
              >{slugLocked ? <Lock size={14} /> : <Unlock size={14} />}</button>}
            </div>
            <small className="cat-hint">
              {slugEditable
                ? <>Lowercase letters, numbers and hyphens. Must be unique.{editing && ' Changing it breaks existing links.'}</>
                : 'Generated by the server from the name and kept stable so existing links keep working.'}
            </small>
            {(touched || form.slug) && (slugErr || dupSlug) && form.slug !== '' && <small className="cat-err">{dupSlug ? 'This slug is already used' : slugErr}</small>}
            {touched && !form.slug && <small className="cat-err">{slugErr}</small>}
          </label>

          <label className="cat-field">
            <span>Parent category</span>
            <select value={form.parentId ?? ''} onChange={(e) => set('parentId', e.target.value || null)} disabled={saving || hasChildren}>
              <option value="">None (top-level)</option>
              {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {hasChildren && <small className="cat-hint">Has sub-categories, so it must stay top-level.</small>}
          </label>

          <label className="cat-field">
            <span>Description <small>{form.description.length}/240</small></span>
            <textarea rows={3} maxLength={240} value={form.description} disabled={saving} placeholder="Shown to customers under the category name" onChange={(e) => set('description', e.target.value)} />
          </label>

          <div className="cat-switchrow">
            <div><strong>{form.active ? 'Active' : 'Inactive'}</strong><small>{form.active ? 'Customers can see and book this category.' : 'Hidden from customers until you turn it on.'}</small></div>
            <button type="button" role="switch" aria-checked={form.active} className={`cat-switch ${form.active ? 'is-on' : ''}`} onClick={() => set('active', !form.active)} disabled={saving} aria-label="Toggle active"><span /></button>
          </div>
        </section>

        <section className="cat-form__sec">
          <h3>Icon <small>small square logo, shown beside the name</small></h3>
          <ImageUploader
            file={iconFile} currentUrl={form.iconUrl} shape="square" label="Upload icon" maxSizeMB={1} disabled={saving}
            onChange={(f) => void pickIcon(f)} onRemoveCurrent={() => set('iconUrl', undefined)}
          />
        </section>

        <section className="cat-form__sec">
          <h3>Cover image <small>the image marked Primary (star) is the cover; extra images form the gallery</small></h3>
          <MultiImageUploader images={form.images} onChange={(imgs) => set('images', imgs)} disabled={saving} />
        </section>
      </form>
    </Drawer>
  );
};

export default CategoryFormDrawer;
