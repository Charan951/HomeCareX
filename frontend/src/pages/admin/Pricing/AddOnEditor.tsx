import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { PricingFormErrors, PricingFormValues } from '@/types/adminPricing';

type AddOns = PricingFormValues['addOns'];
export const MAX_ADDONS = 20;

interface Props {
  addOns: AddOns;
  errors: PricingFormErrors;
  disabled?: boolean;
  onChange: (next: AddOns) => void;
}

/** Vertical card body: optional extras the customer can tick, each with its own price. */
export const AddOnEditor: React.FC<Props> = ({ addOns, errors, disabled, onChange }) => {
  const set = (i: number, patch: Partial<AddOns[number]>) => onChange(addOns.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const err = (i: number, f: 'name' | 'price') => errors[`addOns.${i}.${f}`];

  return (
    <>
      {addOns.length === 0 && <p className="prc-empty">No add-ons yet. Add extras like “Gas refill” that customers can tick at checkout.</p>}
      <ul className="prc-items">
        {addOns.map((a, i) => (
          <li key={i} className="prc-item">
            <label className="cat-field">
              <span>Name</span>
              <input value={a.name} maxLength={60} disabled={disabled} placeholder="Gas refill" aria-invalid={Boolean(err(i, 'name'))} onChange={(e) => set(i, { name: e.target.value })} />
              {err(i, 'name') && <small className="cat-err" role="alert">{err(i, 'name')}</small>}
            </label>
            <div className="prc-item__row">
              <label className="cat-field">
                <span>Price (₹)</span>
                <input type="number" inputMode="numeric" min={0} step={1} value={a.price} disabled={disabled} aria-invalid={Boolean(err(i, 'price'))} onChange={(e) => set(i, { price: e.target.value })} />
                {err(i, 'price') && <small className="cat-err" role="alert">{err(i, 'price')}</small>}
              </label>
              <button type="button" className="cat-iconbtn cat-iconbtn--danger" disabled={disabled} aria-label={`Remove add-on ${i + 1}`} title="Remove" onClick={() => onChange(addOns.filter((_, idx) => idx !== i))}>
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="hcx-btn prc-add" disabled={disabled || addOns.length >= MAX_ADDONS} onClick={() => onChange([...addOns, { name: '', price: '' }])}>
        <Plus size={16} /> Add add-on
      </button>
    </>
  );
};

export default AddOnEditor;
