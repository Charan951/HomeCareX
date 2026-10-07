import React, { useRef, useState } from 'react';
import {
  DndContext, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, GripVertical, ImagePlus, Star, Trash2, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import type { CategoryImage } from '@/types/adminCatalog';
import { fileToDataUrl } from '@/lib/imageFile';

interface Props {
  images: CategoryImage[];
  onChange: (images: CategoryImage[]) => void;
  max?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const uid = () => Math.random().toString(36).slice(2, 10);

/** Ensures exactly one primary image (the first one wins when none/many are flagged). */
const normalize = (list: CategoryImage[]): CategoryImage[] => {
  if (list.length === 0) return list;
  const primary = list.findIndex((i) => i.isPrimary);
  const idx = primary === -1 ? 0 : primary;
  return list.map((i, n) => ({ ...i, isPrimary: n === idx }));
};

const Tile: React.FC<{
  image: CategoryImage; index: number; total: number; disabled?: boolean;
  onPrimary: () => void; onRemove: () => void; onMove: (dir: -1 | 1) => void; onAlt: (v: string) => void;
}> = ({ image, index, total, disabled, onPrimary, onRemove, onMove, onAlt }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('mig-tile', image.isPrimary && 'is-primary', isDragging && 'is-dragging')}
    >
      <div className="mig-tile__img">
        <img src={image.url} alt={image.alt || `Image ${index + 1}`} draggable={false} />
        {image.isPrimary && <span className="mig-tile__badge"><Star size={11} fill="currentColor" /> Primary</span>}
        <button type="button" className="mig-tile__grip" aria-label={`Drag image ${index + 1} to reorder`} {...attributes} {...listeners} disabled={disabled}>
          <GripVertical size={14} />
        </button>
      </div>
      <input
        className="mig-tile__alt" value={image.alt} placeholder="Alt text" maxLength={120}
        aria-label={`Alt text for image ${index + 1}`} disabled={disabled} onChange={(e) => onAlt(e.target.value)}
      />
      <div className="mig-tile__bar">
        <button type="button" className="mig-iconbtn" onClick={() => onMove(-1)} disabled={disabled || index === 0} aria-label="Move earlier"><ChevronLeft size={15} /></button>
        <button type="button" className="mig-iconbtn" onClick={() => onMove(1)} disabled={disabled || index === total - 1} aria-label="Move later"><ChevronRight size={15} /></button>
        <button type="button" className={clsx('mig-iconbtn', image.isPrimary && 'is-on')} onClick={onPrimary} disabled={disabled || image.isPrimary} aria-label="Set as primary" title="Set as primary"><Star size={15} /></button>
        <button type="button" className="mig-iconbtn mig-iconbtn--danger" onClick={onRemove} disabled={disabled} aria-label="Remove image"><Trash2 size={15} /></button>
      </div>
    </li>
  );
};

/** Multi-image gallery: drop / pick many, preview, drag or arrow reorder, pick the primary. */
export const MultiImageUploader: React.FC<Props> = ({ images, onChange, max = 8, maxSizeMB = 3, disabled }) => {
  const input = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const commit = (list: CategoryImage[]) => onChange(normalize(list));

  async function addFiles(files: FileList | File[]) {
    const errs: string[] = [];
    const room = max - images.length;
    const picked = Array.from(files);
    if (picked.length > room) errs.push(`Only ${max} images allowed; ${picked.length - Math.max(room, 0)} skipped`);
    const next: CategoryImage[] = [];
    setBusy(true);
    for (const f of picked.slice(0, Math.max(room, 0))) {
      if (!ALLOWED.includes(f.type)) { errs.push(`${f.name}: use JPG, PNG or WebP`); continue; }
      if (f.size > maxSizeMB * 1024 * 1024) { errs.push(`${f.name}: over ${maxSizeMB} MB`); continue; }
      try {
        next.push({ id: uid(), url: await fileToDataUrl(f), alt: f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '), isPrimary: false });
      } catch (e) { errs.push((e as Error).message); }
    }
    setBusy(false);
    setErrors(errs);
    if (next.length) commit([...images, ...next]);
  }

  const move = (from: number, dir: -1 | 1) => commit(arrayMove(images, from, from + dir));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = images.findIndex((i) => i.id === e.active.id);
    const to = images.findIndex((i) => i.id === e.over!.id);
    if (from > -1 && to > -1) commit(arrayMove(images, from, to));
  };

  return (
    <div className="mig">
      {images.length < max && (
        <div
          className={clsx('mig-drop', dragging && 'is-dragging', disabled && 'is-disabled')}
          role="button" tabIndex={disabled ? -1 : 0} aria-label="Add images"
          onClick={() => !disabled && input.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && (e.preventDefault(), input.current?.click())}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); if (!disabled) void addFiles(e.dataTransfer.files); }}
        >
          <span className="mig-drop__icon">{busy ? <UploadCloud size={22} /> : <ImagePlus size={22} />}</span>
          <p>{busy ? 'Processing…' : 'Drop images here or click to browse'}</p>
          <small>JPG, PNG or WebP · up to {maxSizeMB} MB each · {images.length}/{max} added</small>
        </div>
      )}
      <input ref={input} type="file" hidden multiple accept={ALLOWED.join(',')} onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = ''; }} />
      {errors.length > 0 && <ul className="hcx-uploader__errors" role="alert">{errors.map((x) => <li key={x}>{x}</li>)}</ul>}
      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <ul className="mig-grid" aria-label="Category images">
              {images.map((img, i) => (
                <Tile
                  key={img.id} image={img} index={i} total={images.length} disabled={disabled}
                  onMove={(d) => move(i, d)}
                  onPrimary={() => commit(images.map((x) => ({ ...x, isPrimary: x.id === img.id })))}
                  onRemove={() => commit(images.filter((x) => x.id !== img.id))}
                  onAlt={(v) => commit(images.map((x) => (x.id === img.id ? { ...x, alt: v } : x)))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default MultiImageUploader;
