import React, { useEffect, useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown, ArrowLeft, ArrowUp, ChevronRight, Clock, ExternalLink, FolderTree, GripVertical, ImageIcon, Package, Pencil, Plus, Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { AdminCategory, ReorderItem } from '@/types/adminCatalog';
import type { AdminService } from '@/types/adminService';
import './CategoryExplorer.css';

/**
 * Drill-down catalog browser:  All categories  ->  parent (sub-categories)  ->  sub-category (services).
 * Every level uses the same row layout so cover, name, status and actions line up from level to level.
 */

const bySort = (a: AdminCategory, b: AdminCategory) => a.sortOrder - b.sortOrder;
const coverOf = (c: AdminCategory) => (c.images.find((i) => i.isPrimary) ?? c.images[0])?.url;
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const duration = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} hr${m % 60 ? ` ${m % 60} min` : ''}`);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

type ServicesStatus = 'idle' | 'loading' | 'ready';

interface Props {
  /** Full, unfiltered category list. */
  items: AdminCategory[];
  /** All services (loaded lazily the first time a category is opened). */
  services: AdminService[];
  servicesStatus: ServicesStatus;
  /** Text from the search bar under the navbar. */
  search: string;
  busyIds: Set<string>;
  onNeedServices: () => void;
  onClearSearch: () => void;
  onEdit: (c: AdminCategory) => void;
  onDelete: (c: AdminCategory) => void;
  onToggle: (c: AdminCategory) => void;
  onAddChild: (parent: AdminCategory) => void;
  onReorder: (items: ReorderItem[]) => void;
}

const Cover: React.FC<{ c: AdminCategory; size?: 'sm' | 'lg' }> = ({ c, size }) => {
  const cover = coverOf(c);
  return (
    <span className={clsx('cat-media', size === 'lg' && 'cx-media--lg', !c.active && 'is-off')}>
      <span className="cat-cover" title={cover ? 'Cover image' : 'No cover image uploaded'}>
        {cover ? <img src={cover} alt={`${c.name} cover`} /> : <span className="cat-cover__empty"><ImageIcon size={18} /></span>}
      </span>
      <span className="cat-icon" title={c.iconUrl ? 'Icon' : 'No icon uploaded'}>
        {c.iconUrl ? <img src={c.iconUrl} alt={`${c.name} icon`} /> : <FolderTree size={13} />}
      </span>
    </span>
  );
};

/* ---------------- category row ---------------- */

interface CatRowProps {
  c: AdminCategory; index: number; count: number;
  subCount: number; serviceTotal: number; trail?: string;
  reorderEnabled: boolean; busy: boolean;
  onOpen: () => void; onMove: (dir: -1 | 1) => void;
  onEdit: (c: AdminCategory) => void; onDelete: (c: AdminCategory) => void;
  onToggle: (c: AdminCategory) => void;
}

const CatRow: React.FC<CatRowProps> = ({
  c, index, count, subCount, serviceTotal, trail, reorderEnabled, busy, onOpen, onMove, onEdit, onDelete, onToggle,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id, disabled: !reorderEnabled });
  const isParent = !c.parentId;
  return (
    <li
      ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('cx-row', !c.active && 'is-inactive', isDragging && 'is-dragging', busy && 'is-busy')}
    >
      <button
        type="button" className="cat-grip" disabled={!reorderEnabled} aria-label={`Drag ${c.name}`}
        title={reorderEnabled ? 'Drag to reorder' : 'Clear the search to drag'} {...attributes} {...listeners}
      ><GripVertical size={16} /></button>
      <Cover c={c} />
      <div
        className="cx-main" role="button" tabIndex={0} onClick={onOpen} aria-label={`Open ${c.name}`}
        title={isParent ? 'Open sub-categories' : 'Open services'}
        onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onOpen(); } }}
      >
        <div className="cat-name">
          {trail && <small className="cx-trail-tag">{trail} ›</small>}
          <span>{c.name}</span>
        </div>
        <div className="cat-sub"><code>/{c.slug}</code>{c.description && <span className="cat-desc">{c.description}</span>}</div>
        <div className="cat-pills">
          {isParent && <span className="cat-pill" title="Sub-categories">{plural(subCount, 'sub-category', 'sub-categories')}</span>}
          <span className={clsx('cat-pill', serviceTotal > 0 && 'is-link')} title="Services in this category">{plural(serviceTotal, 'service')}</span>
          {!c.images.length && !c.iconUrl && <span className="cat-pill is-warn">No images yet</span>}
        </div>
      </div>
      <div className="cx-foot">
        <button
          type="button" role="switch" aria-checked={c.active} className={clsx('cat-toggle', c.active && 'is-on')}
          onClick={() => onToggle(c)} disabled={busy} aria-label={`${c.active ? 'Deactivate' : 'Activate'} ${c.name}`}
          title={c.active ? 'Visible to customers. Click to hide.' : 'Hidden from customers. Click to show.'}
        >
          <span className="cat-toggle__track"><i /></span>
          <span className="cat-toggle__text">{c.active ? 'Active' : 'Inactive'}</span>
        </button>
        <div className="cat-actions">
          <span className="cat-actions__move">
            <button type="button" className="cat-iconbtn" onClick={() => onMove(-1)} disabled={!reorderEnabled || index === 0 || busy} aria-label={`Move ${c.name} up`} title="Move up"><ArrowUp size={15} /></button>
            <button type="button" className="cat-iconbtn" onClick={() => onMove(1)} disabled={!reorderEnabled || index === count - 1 || busy} aria-label={`Move ${c.name} down`} title="Move down"><ArrowDown size={15} /></button>
          </span>
          <button type="button" className="cat-iconbtn" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`} title="Edit"><Pencil size={15} /></button>
          <button
            type="button" className="cat-iconbtn cat-iconbtn--danger" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`}
            title={c.services > 0 ? 'Has services: deletion is blocked' : subCount > 0 ? 'Has sub-categories' : 'Delete'}
          ><Trash2 size={15} /></button>
        </div>
      </div>
    </li>
  );
};

/* ---------------- service row (same alignment as a category row) ---------------- */

const ServiceLine: React.FC<{ s: AdminService }> = ({ s }) => {
  const cover = s.images.find((i) => i.isPrimary) ?? s.images[0];
  return (
    <li className={clsx('cx-row cx-row--svc', !s.active && 'is-inactive')}>
      <span className="cx-grip-gap" aria-hidden />
      <span className={clsx('cat-media', !s.active && 'is-off')}>
        <span className="cat-cover">
          {cover ? <img src={cover.url} alt="" loading="lazy" /> : <span className="cat-cover__empty"><ImageIcon size={18} /></span>}
        </span>
      </span>
      <div className="cx-main">
        <div className="cat-name"><span>{s.name}</span></div>
        <div className="cat-sub"><code>/{s.slug}</code></div>
        <div className="cat-pills">
          <span className="cat-pill"><b>{rupees(s.basePrice)}</b></span>
          <span className="cat-pill"><Clock size={11} aria-hidden /> {duration(s.durationMinutes)}</span>
        </div>
      </div>
      <div className="cx-foot">
        <span className={clsx('cx-status', s.active && 'is-on')}>{s.active ? 'Active' : 'Inactive'}</span>
        <div className="cat-actions">
          <Link className="cat-iconbtn" to={`/admin/services?category=${encodeURIComponent(s.categoryId)}`} aria-label={`Open ${s.name} in Services`} title="Manage in Services"><ExternalLink size={15} /></Link>
        </div>
      </div>
    </li>
  );
};

const ServiceList: React.FC<{ list: AdminService[]; status: ServicesStatus; emptyText: string }> = ({ list, status, emptyText }) => {
  if (status !== 'ready') {
    return <div className="cx-skel" aria-label="Loading services">{[0, 1].map((n) => <span key={n} className="hcx-skeleton hcx-skeleton--block" style={{ height: 78 }} />)}</div>;
  }
  if (list.length === 0) return <p className="cx-none">{emptyText}</p>;
  return <ul className="cx-list" aria-label="Services">{list.map((s) => <ServiceLine key={s.id} s={s} />)}</ul>;
};

/* ---------------- explorer ---------------- */

export const CategoryExplorer: React.FC<Props> = ({
  items, services, servicesStatus, search, busyIds, onNeedServices, onClearSearch, onEdit, onDelete, onToggle, onAddChild, onReorder,
}) => {
  const [path, setPath] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const byId = useMemo(() => new Map(items.map((c) => [c.id, c])), [items]);
  const siblings = (parentId: string | null) => items.filter((c) => c.parentId === parentId).sort(bySort);
  const subsOf = (id: string) => siblings(id);
  const needle = search.trim().toLowerCase();
  const searching = needle !== '';

  // A category that was deleted (or moved) while it was open sends the view back to the top.
  useEffect(() => { if (path.some((id) => !byId.has(id))) setPath([]); }, [byId, path]);
  // Services are only fetched once someone actually drills in.
  useEffect(() => { if (path.length > 0) onNeedServices(); }, [path.length, onNeedServices]);

  const current = path.length ? byId.get(path[path.length - 1]) : undefined;
  const serviceTotal = (c: AdminCategory) => c.services + (c.parentId ? 0 : subsOf(c.id).reduce((n, k) => n + k.services, 0));

  function commitMove(parentId: string | null, id: string, toIndex: number) {
    const group = siblings(parentId);
    const from = group.findIndex((c) => c.id === id);
    if (from < 0 || toIndex < 0 || toIndex >= group.length || from === toIndex) return;
    onReorder(arrayMove(group, from, toIndex).map((c, i) => ({ id: c.id, parentId, sortOrder: i })));
  }
  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || e.active.id === e.over.id) return;
    const a = byId.get(String(e.active.id));
    const o = byId.get(String(e.over.id));
    if (!a || !o || a.parentId !== o.parentId) return;
    commitMove(a.parentId, a.id, siblings(a.parentId).findIndex((c) => c.id === o.id));
  };
  const dragged = activeId ? byId.get(activeId) : undefined;

  const openCategory = (c: AdminCategory) => {
    if (searching) onClearSearch();
    setPath(c.parentId ? [c.parentId, c.id] : [c.id]);
  };

  const renderCategories = (list: AdminCategory[], parentId: string | null, label: string) => (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
      <SortableContext items={list.map((c) => c.id)} strategy={verticalListSortingStrategy} disabled={searching}>
        <ul className="cx-list" aria-label={label}>
          {list.map((c, i) => (
            <CatRow
              key={c.id} c={c} index={i} count={list.length}
              subCount={c.parentId ? 0 : subsOf(c.id).length} serviceTotal={serviceTotal(c)}
              trail={searching && c.parentId ? byId.get(c.parentId)?.name : undefined}
              reorderEnabled={!searching} busy={busyIds.has(c.id)}
              onOpen={() => openCategory(c)}
              onMove={(d) => commitMove(parentId, c.id, siblings(parentId).findIndex((x) => x.id === c.id) + d)}
              onEdit={onEdit} onDelete={onDelete} onToggle={onToggle}
            />
          ))}
        </ul>
      </SortableContext>
      <DragOverlay>{dragged && <div className="cat-overlay"><GripVertical size={16} /><strong>{dragged.name}</strong></div>}</DragOverlay>
    </DndContext>
  );

  /* ---- search: flat list across every level ---- */
  if (searching) {
    const hits = items
      .filter((c) => [c.name, c.slug, c.description].some((v) => (v ?? '').toLowerCase().includes(needle)))
      .sort((a, b) => Number(!!a.parentId) - Number(!!b.parentId) || bySort(a, b));
    return (
      <div className="cx">
        <p className="cat-note">Showing {plural(hits.length, 'match', 'matches')} across all levels. Drag-and-drop and Move Up/Down are paused while a search is active.</p>
        {hits.length === 0 ? (
          <div className="cat-empty">
            <FolderTree size={34} />
            <h3>No categories match your search</h3>
            <p>Try a different name, slug or description.</p>
            <button type="button" className="hcx-btn" onClick={onClearSearch}>Clear search</button>
          </div>
        ) : renderCategories(hits, null, 'Search results')}
      </div>
    );
  }

  /* ---- trail ---- */
  const trail = (
    <nav className="cx-trail" aria-label="Category path">
      {path.length > 0 && (
        <button type="button" className="cx-back" onClick={() => setPath(path.slice(0, -1))}><ArrowLeft size={15} /> Back</button>
      )}
      {path.length === 0 ? <span className="cx-trail__here" aria-current="page">All categories</span> : <button type="button" className="cx-trail__link" onClick={() => setPath([])}>All categories</button>}
      {path.map((id, i) => {
        const c = byId.get(id);
        if (!c) return null;
        return (
          <React.Fragment key={id}>
            <ChevronRight size={14} className="cx-trail__sep" aria-hidden />
            {i === path.length - 1
              ? <span className="cx-trail__here" aria-current="page">{c.name}</span>
              : <button type="button" className="cx-trail__link" onClick={() => setPath(path.slice(0, i + 1))}>{c.name}</button>}
          </React.Fragment>
        );
      })}
    </nav>
  );

  /* ---- root: parent categories ---- */
  if (!current) {
    return (
      <div className="cx">
        {renderCategories(siblings(null), null, 'Categories')}
      </div>
    );
  }

  /* ---- inside a category ---- */
  const isParent = !current.parentId;
  const subs = isParent ? subsOf(current.id) : [];
  const own = services.filter((s) => s.categoryId === current.id);
  const header = (
    <section className="cx-hero">
      <Cover c={current} size="lg" />
      <div className="cx-hero__text">
        <h3>{current.name}</h3>
        <p>{current.description || 'No description yet.'}</p>
        <div className="cat-pills">
          <span className={clsx('cat-pill', current.active ? 'is-link' : '')}>{current.active ? 'Active' : 'Inactive'}</span>
          {isParent && <span className="cat-pill">{plural(subs.length, 'sub-category', 'sub-categories')}</span>}
          <span className="cat-pill">{plural(serviceTotal(current), 'service')}</span>
        </div>
      </div>
      <div className="cx-hero__actions">
        <button type="button" className="hcx-btn" onClick={() => onEdit(current)}><Pencil size={15} /> Edit</button>
        {isParent && <button type="button" className="hcx-btn" onClick={() => onAddChild(current)}><Plus size={15} /> Sub-category</button>}
        <Link className="hcx-btn hcx-btn--primary" to={`/admin/services?category=${encodeURIComponent(current.id)}&new=1`}><Package size={15} /> Add service</Link>
      </div>
    </section>
  );

  return (
    <div className="cx">
      {trail}
      {header}

      {isParent && (
        <section className="cx-sec">
          <div className="cx-sec__head"><h4>Sub-categories <small>{subs.length}</small></h4></div>
          {subs.length === 0
            ? <p className="cx-none">No sub-categories yet. Use “Sub-category” above to add one.</p>
            : renderCategories(subs, current.id, 'Sub-categories')}
        </section>
      )}

      {(!isParent || own.length > 0 || servicesStatus !== 'ready' || current.services > 0) && (
        <section className="cx-sec">
          <div className="cx-sec__head"><h4>{isParent ? `Services directly in ${current.name}` : 'Services'} <small>{servicesStatus === 'ready' ? own.length : '…'}</small></h4></div>
          <ServiceList list={own} status={servicesStatus} emptyText="No services in this category yet. Use “Add service” above to create one." />
        </section>
      )}
    </div>
  );
};

export default CategoryExplorer;
