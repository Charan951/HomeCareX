import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { PricingFormErrors, PricingFormValues } from '@/types/adminPricing';

type Windows = PricingFormValues['surgeWindows'];
export const MAX_SURGE = 10;

interface Props {
  windows: Windows;
  errors: PricingFormErrors;
  disabled?: boolean;
  onChange: (next: Windows) => void;
}

/** Vertical card body: time windows where a slot costs a percentage more. */
export const SurgeWindowEditor: React.FC<Props> = ({ windows, errors, disabled, onChange }) => {
  const set = (i: number, patch: Partial<Windows[number]>) => onChange(windows.map((w, idx) => (idx === i ? { ...w, ...patch } : w)));
  const err = (i: number, f: keyof Windows[number]) => errors[`surgeWindows.${i}.${f}`];
  const msg = (i: number, f: keyof Windows[number]) => err(i, f) && <small className="cat-err" role="alert">{err(i, f)}</small>;

  return (
    <>
      {windows.length === 0 && <p className="prc-empty">No surge windows. Prices stay flat all day.</p>}
      <ul className="prc-items">
        {windows.map((w, i) => (
          <li key={i} className="prc-item">
            <label className="cat-field">
              <span>Label</span>
              <input value={w.label} maxLength={40} disabled={disabled} placeholder="Evening peak" aria-invalid={Boolean(err(i, 'label'))} onChange={(e) => set(i, { label: e.target.value })} />
              {msg(i, 'label')}
            </label>
            <div className="prc-item__row prc-item__row--2">
              <label className="cat-field">
                <span>From</span>
                <input type="time" value={w.startTime} disabled={disabled} aria-invalid={Boolean(err(i, 'startTime'))} onChange={(e) => set(i, { startTime: e.target.value })} />
                {msg(i, 'startTime')}
              </label>
              <label className="cat-field">
                <span>To</span>
                <input type="time" value={w.endTime} disabled={disabled} aria-invalid={Boolean(err(i, 'endTime'))} onChange={(e) => set(i, { endTime: e.target.value })} />
                {msg(i, 'endTime')}
              </label>
            </div>
            <div className="prc-item__row">
              <label className="cat-field">
                <span>Surge %</span>
                <input type="number" inputMode="decimal" min={0} max={200} value={w.percent} disabled={disabled} aria-invalid={Boolean(err(i, 'percent'))} onChange={(e) => set(i, { percent: e.target.value })} />
                {msg(i, 'percent')}
              </label>
              <button type="button" className="cat-iconbtn cat-iconbtn--danger" disabled={disabled} aria-label={`Remove surge window ${i + 1}`} title="Remove" onClick={() => onChange(windows.filter((_, idx) => idx !== i))}>
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" className="hcx-btn prc-add" disabled={disabled || windows.length >= MAX_SURGE} onClick={() => onChange([...windows, { label: '', startTime: '18:00', endTime: '20:00', percent: '10' }])}>
        <Plus size={16} /> Add surge window
      </button>
    </>
  );
};

export default SurgeWindowEditor;
