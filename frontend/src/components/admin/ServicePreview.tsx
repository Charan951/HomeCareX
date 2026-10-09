import React, { useEffect, useState } from 'react';
import {
  DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, GripVertical, ImageIcon, Star } from 'lucide-react';
import clsx from 'clsx';
import { FullScreenPanel } from '@/components/admin/FullScreenPanel';
import type { AdminService, ServiceImage } from '@/types/adminService';

interface Props {
  service: AdminService | null;
  canManage: boolean;
  saving: boolean;
  onClose: () => void;
  /** Persist a new image order / primary choice. */
  onSaveImages: (service: AdminService, images: ServiceImage[]) => void;
}

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const duration = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`);

/** Exactly one primary, and the primary always first (the wire format sends it first). */
const withPrimaryFirst = (list: ServiceImage[]): ServiceImage[] => {
  if (!list.length) return list;
  const idx = Math.max(0, list.findIndex((i) => i.isPrimary));
  const flagged = list.map((i, n) => ({ ...i, isPrimary: n === idx }));
  return [flagged[idx], ...flagged.filter((_, n) => n !== idx)];
};

const Thumb: React.FC<{ image: ServiceImage; index: number; active: boolean; disabled: boolean; onSelect: () => void; onPrimary: () => void }> = ({
  image, index, active, disabled, onSelect, onPrimary,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id, disabled });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={clsx('svp-thumb', active && 'is-active', image.isPrimary && 'is-primary', isDragging && 'is-dragging')}>
      <button type="button" className="svp-thumb__img" onClick={onSelect} aria-label={`Preview image ${index + 1}${image.isPrimary ? ' (primary)' : ''}`}>
        <img src={image.url} alt="" draggable={false} />
      </button>
      {image.isPrimary && <span className="mig-tile__badge"><Star size={11} fill="currentColor" /> Primary</span>}
      <div className="svp-thumb__bar">
        <button type="button" className="mig-iconbtn" aria-label={`Drag image ${index + 1} to reorder`} disabled={disabled} {...attributes} {...listeners}><GripVertical size={15} /></button>
        <button type="button" className={clsx('mig-iconbtn', image.isPrimary && 'is-on')} aria-label={`Make image ${index + 1} primary`} title="Set as primary" disabled={disabled || image.isPrimary} onClick={onPrimary}><Star size={15} /></button>
      </div>
    </li>
  );
};

/** Customer-style preview of a service, with drag-to-reorder thumbnails and a primary-image picker. */
export const ServicePreview: React.FC<Props> = ({ service, canManage, saving, onClose, onSaveImages }) => {
  const [images, setImages] = useState<ServiceImage[]>([]);
  const [current, setCurrent] = useState(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => { setImages(service ? withPrimaryFirst(service.images) : []); setCurrent(0); }, [service]);

  const dirty = !!service && JSON.stringify(images.map((i) => [i.id, i.isPrimary])) !== JSON.stringify(withPrimaryFirst(service.images).map((i) => [i.id, i.isPrimary]));
  const hero = images[current] ?? images[0];

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = images.findIndex((i) => i.id === e.active.id);
    const to = images.findIndex((i) => i.id === e.over!.id);
    if (from > -1 && to > -1) { setImages(arrayMove(images, from, to)); setCurrent(to); }
  };
  const makePrimary = (id: string) => { setImages(withPrimaryFirst(images.map((i) => ({ ...i, isPrimary: i.id === id })))); setCurrent(0); };

  return (
    <FullScreenPanel
      open={!!service} onClose={onClose}
      title={service ? `Preview · ${service.name}` : 'Preview'}
      subtitle="How this service looks to customers. Reorder photos or change the primary one."
      footer={canManage && (
        <>
          <button type="button" className="hcx-btn" onClick={onClose} disabled={saving}>Close</button>
          <button type="button" className="hcx-btn hcx-btn--primary" disabled={!dirty || saving} onClick={() => service && onSaveImages(service, images)}>{saving ? 'Saving…' : 'Save image order'}</button>
        </>
      )}
    >
      {service && (
        <div className="svp svp--fs">
          <div className="svp-media">
          <div className="svp-hero">
            {hero ? <img src={hero.url} alt={hero.alt || service.name} /> : <div className="svp-hero__empty"><ImageIcon size={32} aria-hidden /><span>No photos yet</span></div>}
          </div>

          {images.length > 0 && (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
                <ul className="svp-thumbs" aria-label="Service photos. Drag to reorder.">
                  {images.map((img, i) => (
                    <Thumb key={img.id} image={img} index={i} active={i === current} disabled={!canManage || saving} onSelect={() => setCurrent(i)} onPrimary={() => makePrimary(img.id)} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          </div>

          <div className="svp-info">
          <div className="svp-head">
            <h3>{service.name}</h3>
            <span className="svp-chip">{service.categoryName || 'Uncategorised'}</span>
          </div>
          <p className="svp-price"><b>{rupees(service.basePrice)}</b><span><Clock size={14} aria-hidden /> {duration(service.durationMinutes)}</span></p>
          {service.description && <p className="svp-desc">{service.description}</p>}

          <div className="svp-cols">
            {service.inclusions.length > 0 && <div><h4>Included</h4><ul>{service.inclusions.map((x) => <li key={x}>{x}</li>)}</ul></div>}
            {service.exclusions.length > 0 && <div><h4>Not included</h4><ul>{service.exclusions.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          </div>
          {service.addOns.length > 0 && <div><h4>Add-ons</h4><ul className="svp-addons">{service.addOns.map((a) => <li key={a.id}><span>{a.name}</span><b>{rupees(a.price)}</b></li>)}</ul></div>}
          {service.faqs.length > 0 && <div><h4>FAQs</h4>{service.faqs.map((f) => <details key={f.id} className="svp-faq"><summary>{f.question}</summary><p>{f.answer}</p></details>)}</div>}
          </div>
        </div>
      )}
    </FullScreenPanel>
  );
};

export default ServicePreview;
