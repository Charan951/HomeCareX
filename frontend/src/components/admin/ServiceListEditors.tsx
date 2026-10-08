import React, { useId } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { arrayMove } from '@/lib/arrayMove';
import type { ChecklistItem, ServiceAddOn, ServiceFaq } from '@/types/adminService';

const uid = () => Math.random().toString(36).slice(2, 10);

interface RowToolsProps {
  index: number;
  total: number;
  noun: string;
  disabled?: boolean;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

/** Move up / Move down / Remove for one row. Plain buttons, so it works with the keyboard alone. */
const RowTools: React.FC<RowToolsProps> = ({ index, total, noun, disabled, onMove, onRemove }) => (
  <div className="svc-rowtools">
    <button type="button" className="mig-iconbtn" onClick={() => onMove(-1)} disabled={disabled || index === 0} aria-label={`Move ${noun} ${index + 1} up`}><ArrowUp size={15} /></button>
    <button type="button" className="mig-iconbtn" onClick={() => onMove(1)} disabled={disabled || index === total - 1} aria-label={`Move ${noun} ${index + 1} down`}><ArrowDown size={15} /></button>
    <button type="button" className="mig-iconbtn mig-iconbtn--danger" onClick={onRemove} disabled={disabled} aria-label={`Remove ${noun} ${index + 1}`}><Trash2 size={15} /></button>
  </div>
);

interface ShellProps {
  title: string;
  hint?: string;
  count: string;
  error?: string;
  addLabel: string;
  canAdd: boolean;
  disabled?: boolean;
  onAdd: () => void;
  children: React.ReactNode;
  empty: string;
  isEmpty: boolean;
}

const Shell: React.FC<ShellProps> = ({ title, hint, count, error, addLabel, canAdd, disabled, onAdd, children, empty, isEmpty }) => {
  const id = useId();
  return (
    <section className="cat-form__sec" aria-labelledby={id}>
      <h3 id={id}>{title} <small>{hint ? `${hint} · ` : ''}{count}</small></h3>
      {isEmpty ? <p className="svc-empty">{empty}</p> : <ul className="svc-rows">{children}</ul>}
      {error && <small className="cat-err" role="alert">{error}</small>}
      <div>
        <button type="button" className="hcx-btn" onClick={onAdd} disabled={disabled || !canAdd}><Plus size={15} /> {addLabel}</button>
      </div>
    </section>
  );
};

interface StringListProps {
  title: string;
  hint?: string;
  noun: string;
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  maxLength: number;
  placeholder: string;
  error?: string;
  disabled?: boolean;
}

/** Ordered list of short text lines: inclusions and exclusions. */
export const StringListEditor: React.FC<StringListProps> = ({ title, hint, noun, items, onChange, max, maxLength, placeholder, error, disabled }) => (
  <Shell
    title={title} hint={hint} count={`${items.length}/${max}`} error={error} addLabel={`Add ${noun}`}
    canAdd={items.length < max} disabled={disabled} onAdd={() => onChange([...items, ''])}
    isEmpty={items.length === 0} empty={`No ${noun}s yet.`}
  >
    {items.map((value, i) => (
      <li key={i} className="svc-row">
        <input
          value={value} maxLength={maxLength} placeholder={placeholder} disabled={disabled}
          aria-label={`${title} line ${i + 1}`} aria-invalid={Boolean(error) && !value.trim()}
          onChange={(e) => onChange(items.map((x, n) => (n === i ? e.target.value : x)))}
        />
        <RowTools index={i} total={items.length} noun={noun} disabled={disabled} onMove={(d) => onChange(arrayMove(items, i, i + d))} onRemove={() => onChange(items.filter((_, n) => n !== i))} />
      </li>
    ))}
  </Shell>
);

interface FaqProps { items: ServiceFaq[]; onChange: (items: ServiceFaq[]) => void; max: number; error?: string; disabled?: boolean }

export const FaqEditor: React.FC<FaqProps> = ({ items, onChange, max, error, disabled }) => {
  const patch = (id: string, p: Partial<ServiceFaq>) => onChange(items.map((f) => (f.id === id ? { ...f, ...p } : f)));
  return (
    <Shell
      title="FAQs" hint="shown on the service page" count={`${items.length}/${max}`} error={error} addLabel="Add FAQ"
      canAdd={items.length < max} disabled={disabled} onAdd={() => onChange([...items, { id: uid(), question: '', answer: '' }])}
      isEmpty={items.length === 0} empty="No FAQs yet."
    >
      {items.map((f, i) => (
        <li key={f.id} className="svc-row svc-row--stack">
          <div className="svc-row__fields">
            <input value={f.question} maxLength={200} placeholder="Question" aria-label={`FAQ ${i + 1} question`} disabled={disabled} onChange={(e) => patch(f.id, { question: e.target.value })} />
            <textarea value={f.answer} rows={2} maxLength={1000} placeholder="Answer" aria-label={`FAQ ${i + 1} answer`} disabled={disabled} onChange={(e) => patch(f.id, { answer: e.target.value })} />
          </div>
          <RowTools index={i} total={items.length} noun="FAQ" disabled={disabled} onMove={(d) => onChange(arrayMove(items, i, i + d))} onRemove={() => onChange(items.filter((x) => x.id !== f.id))} />
        </li>
      ))}
    </Shell>
  );
};

interface AddOnProps { items: ServiceAddOn[]; onChange: (items: ServiceAddOn[]) => void; max: number; error?: string; disabled?: boolean }

export const AddOnEditor: React.FC<AddOnProps> = ({ items, onChange, max, error, disabled }) => {
  const patch = (id: string, p: Partial<ServiceAddOn>) => onChange(items.map((a) => (a.id === id ? { ...a, ...p } : a)));
  return (
    <Shell
      title="Add-ons" hint="optional extras the customer can tick" count={`${items.length}/${max}`} error={error} addLabel="Add add-on"
      canAdd={items.length < max} disabled={disabled} onAdd={() => onChange([...items, { id: uid(), name: '', price: 0 }])}
      isEmpty={items.length === 0} empty="No add-ons yet."
    >
      {items.map((a, i) => (
        <li key={a.id} className="svc-row">
          <input value={a.name} maxLength={60} placeholder="Add-on name" aria-label={`Add-on ${i + 1} name`} disabled={disabled} onChange={(e) => patch(a.id, { name: e.target.value })} />
          <label className="svc-money">
            <span aria-hidden>₹</span>
            <input
              type="number" inputMode="decimal" min={0} step="1" value={Number.isNaN(a.price) ? '' : a.price}
              aria-label={`Add-on ${i + 1} price in rupees`} disabled={disabled}
              onChange={(e) => patch(a.id, { price: e.target.value === '' ? Number.NaN : Number(e.target.value) })}
            />
          </label>
          <RowTools index={i} total={items.length} noun="add-on" disabled={disabled} onMove={(d) => onChange(arrayMove(items, i, i + d))} onRemove={() => onChange(items.filter((x) => x.id !== a.id))} />
        </li>
      ))}
    </Shell>
  );
};

interface ChecklistProps { items: ChecklistItem[]; onChange: (items: ChecklistItem[]) => void; max: number; error?: string; disabled?: boolean }

/** Checklist template: the steps a partner confirms on site. "Required" steps must be ticked before the job can close. */
export const ChecklistEditor: React.FC<ChecklistProps> = ({ items, onChange, max, error, disabled }) => {
  const patch = (id: string, p: Partial<ChecklistItem>) => onChange(items.map((c) => (c.id === id ? { ...c, ...p } : c)));
  return (
    <Shell
      title="Checklist template" hint="steps the partner confirms on site" count={`${items.length}/${max}`} error={error} addLabel="Add step"
      canAdd={items.length < max} disabled={disabled} onAdd={() => onChange([...items, { id: uid(), label: '', required: true }])}
      isEmpty={items.length === 0} empty="No checklist steps yet."
    >
      {items.map((c, i) => (
        <li key={c.id} className="svc-row">
          <input value={c.label} maxLength={120} placeholder="e.g. Take before/after photos" aria-label={`Checklist step ${i + 1}`} disabled={disabled} onChange={(e) => patch(c.id, { label: e.target.value })} />
          <label className="svc-check">
            <input type="checkbox" checked={c.required} disabled={disabled} onChange={(e) => patch(c.id, { required: e.target.checked })} />
            Required
          </label>
          <RowTools index={i} total={items.length} noun="step" disabled={disabled} onMove={(d) => onChange(arrayMove(items, i, i + d))} onRemove={() => onChange(items.filter((x) => x.id !== c.id))} />
        </li>
      ))}
    </Shell>
  );
};
