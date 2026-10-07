import React, { useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, closestCenter, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ArrowDown, ArrowUp, ChevronRight, CornerDownRight, FolderTree, GripVertical, History, ImageIcon, Pencil, Plus, Trash2,
} from 'lucide-react';
import clsx from 'clsx';
import type { AdminCategory, ReorderItem } from '@/types/adminCatalog';

export interface TreeNode { category: AdminCategory; children: AdminCategory[] }

interface Props {
  nodes: TreeNode[];
  /** Full, unfiltered list: reorder positions are computed against it so hidden rows keep their place. */
  all: AdminCategory[];
  onEdit: (c: AdminCategory) => void;
  onDelete: (c: AdminCategory) => void;
  onToggle: (c: AdminCategory) => void;
  onAddChild: (parent: AdminCategory) => void;
  onReorder: (items: ReorderItem[]) => void;
  /** Dragging is only meaningful in manual sort with no filter/search active. */
  reorderEnabled: boolean;
  busyIds: Set<string>;
}

/** Cover (primary gallery image) with the uploaded icon pinned to its corner. No emoji: admins see the real images. */
const coverOf = (c: AdminCategory) => (c.images.find((i) => i.isPrimary) ?? c.images[0])?.url;

const Media: React.FC<{ c: AdminCategory; small?: boolean }> = ({ c, small }) => {
  const cover = coverOf(c);
  return (
    <span className={clsx('cat-media', small && 'is-small', !c.active && 'is-off')}>
      <span className="cat-cover" title={cover ? 'Cover image' : 'No cover image uploaded'}>
        {cover ? <img src={cover} alt={`${c.name} cover`} /> : <span className="cat-cover__empty"><ImageIcon size={small ? 15 : 18} /></span>}
      </span>
      <span className="cat-icon" title={c.iconUrl ? 'Icon' : 'No icon uploaded'}>
        {c.iconUrl ? <img src={c.iconUrl} alt={`${c.name} icon`} /> : <FolderTree size={small ? 11 : 13} />}
      </span>
    </span>
  );
};

interface RowProps extends Omit<Props, 'nodes' | 'all' | 'onReorder'> {
  c: AdminCategory; sub?: boolean; index: number; count: number; hasKids?: boolean;
  open?: boolean; onOpen?: () => void; onMove: (dir: -1 | 1) => void;
}

const Row: React.FC<RowProps> = ({
  c, sub, index, count, hasKids, open, onOpen, onMove, onEdit, onDelete, onToggle, onAddChild,
  reorderEnabled, busyIds,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: c.id, disabled: !reorderEnabled });
  const busy = busyIds.has(c.id);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('cat-row', sub && 'cat-row--sub', !c.active && 'is-inactive', isDragging && 'is-dragging', busy && 'is-busy')}
    >
      <button
        type="button" className="cat-grip" disabled={!reorderEnabled}
        aria-label={`Drag ${c.name}`} title={reorderEnabled ? 'Drag to reorder' : 'Clear filters and use manual order to drag'}
        {...attributes} {...listeners}
      ><GripVertical size={16} /></button>
      {sub ? <CornerDownRight size={15} className="cat-elbow" aria-hidden /> : (
        <button
          type="button" className={clsx('cat-chevron', open && 'is-open', !hasKids && 'is-hidden')}
          onClick={onOpen} aria-label={open ? `Collapse ${c.name}` : `Expand ${c.name}`} aria-expanded={open} tabIndex={hasKids ? 0 : -1}
        ><ChevronRight size={16} /></button>
      )}
      <Media c={c} small={sub} />
      <div className="cat-main">
        <div className="cat-name">
          <span>{c.name}</span>
        </div>
        <div className="cat-sub"><code>/{c.slug}</code>{c.description && <span className="cat-desc">{c.description}</span>}</div>
        <div className="cat-pills">
          <span className="cat-pill" title="Services in this category">{c.services} service{c.services === 1 ? '' : 's'}</span>
          {c.images.length > 1 && <span className="cat-pill" title="Gallery images"><ImageIcon size={11} /> {c.images.length} images</span>}
          {!c.images.length && !c.iconUrl && <span className="cat-pill is-warn">No images yet</span>}
        </div>
      </div>
      <div className="cat-foot">
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
        {!sub && <button type="button" className="cat-iconbtn" onClick={() => onAddChild(c)} aria-label={`Add sub-category to ${c.name}`} title="Add sub-category"><Plus size={15} /></button>}
        <button type="button" className="cat-iconbtn" onClick={() => onEdit(c)} aria-label={`Edit ${c.name}`} title="Edit"><Pencil size={15} /></button>
        <button
          type="button" className="cat-iconbtn cat-iconbtn--danger" onClick={() => onDelete(c)} aria-label={`Delete ${c.name}`}
          title={c.services > 0 ? 'Has services: deletion is blocked' : hasKids ? 'Has sub-categories' : 'Delete'}
        ><Trash2 size={15} /></button>
      </div>
      </div>
    </li>
  );
};

/** Parent / sub-category tree. Drag within a level (dnd-kit) or use Move Up / Move Down. */
export const CategoryTree: React.FC<Props> = (props) => {
  const { nodes, all, onReorder, reorderEnabled } = props;
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const siblings = (parentId: string | null) =>
    all.filter((c) => c.parentId === parentId).sort((a, b) => a.sortOrder - b.sortOrder);

  /** Re-numbers a sibling group 0..n-1 after moving `id` to `toIndex`. */
  function commitMove(parentId: string | null, id: string, toIndex: number) {
    const group = siblings(parentId);
    const from = group.findIndex((c) => c.id === id);
    if (from < 0 || toIndex < 0 || toIndex >= group.length || from === toIndex) return;
    const next = arrayMove(group, from, toIndex);
    onReorder(next.map((c, i) => ({ id: c.id, parentId, sortOrder: i })));
  }

  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over || e.active.id === e.over.id) return;
    const a = all.find((c) => c.id === e.active.id);
    const o = all.find((c) => c.id === e.over!.id);
    if (!a || !o || a.parentId !== o.parentId) return; // cross-level moves go through the Edit form
    const group = siblings(a.parentId);
    commitMove(a.parentId, a.id, group.findIndex((c) => c.id === o.id));
  };
  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const dragged = activeId ? all.find((c) => c.id === activeId) : null;

  const rows = (
    <ul className="cat-list" aria-label="Categories">
      {nodes.map(({ category: p, children }) => {
        const open = !collapsed.has(p.id);
        const pGroup = nodes.map((n) => n.category);
        return (
          <li key={p.id} className="cat-group">
            <ul className="cat-list cat-list--flat">
              <Row
                {...props} c={p} index={pGroup.findIndex((x) => x.id === p.id)} count={pGroup.length}
                hasKids={children.length > 0} open={open}
                onOpen={() => setCollapsed((s) => { const n = new Set(s); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; })}
                onMove={(d) => commitMove(null, p.id, siblings(null).findIndex((c) => c.id === p.id) + d)}
              />
            </ul>
            {open && children.length > 0 && (
              <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <ul className="cat-list cat-list--flat cat-children">
                  {children.map((c, i) => (
                    <Row
                      key={c.id} {...props} c={c} sub index={i} count={children.length}
                      onMove={(d) => commitMove(p.id, c.id, siblings(p.id).findIndex((x) => x.id === c.id) + d)}
                    />
                  ))}
                </ul>
              </SortableContext>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="cat-tree">
      <div className="cat-tree__head">
        <span className="cat-tree__all">Category</span>
        <span className="cat-tree__hint"><History size={13} /> Every change is audited</span>
        <span className="cat-tree__cols"><span>Status</span><span>Actions</span></span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActiveId(null)}>
        <SortableContext items={nodes.map((n) => n.category.id)} strategy={verticalListSortingStrategy} disabled={!reorderEnabled}>
          {rows}
        </SortableContext>
        <DragOverlay>
          {dragged && (
            <div className="cat-overlay"><Media c={dragged} small /><strong>{dragged.name}</strong></div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default CategoryTree;