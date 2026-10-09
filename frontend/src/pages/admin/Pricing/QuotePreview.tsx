import React, { useMemo, useState } from 'react';
import type { PricingFormValues } from '@/types/adminPricing';

/** Display-only estimate for the admin. The real price always comes from POST /pricing/quote. */
const SLOTS = ['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00'];
const CONVENIENCE_FEE = 29;
const GST = 0.18;

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const Row: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div className={`prc-row${muted ? ' is-muted' : ''}`}><dt>{label}</dt><dd>{value}</dd></div>
);

/** Vertical card: lets the admin try a slot, quantity and add-ons against the values being edited. */
export const QuotePreview: React.FC<{ values: PricingFormValues }> = ({ values }) => {
  const [slot, setSlot] = useState(SLOTS[0]);
  const [qty, setQty] = useState('1');
  const [picked, setPicked] = useState<Set<number>>(new Set());

  const q = useMemo(() => {
    const n = Math.max(1, Math.floor(Number(qty) || 1));
    const unit = Math.max(0, Number(values.basePrice) || 0);
    const base = unit * n;
    const addOns = values.addOns.reduce((sum, a, i) => (picked.has(i) ? sum + Math.max(0, Number(a.price) || 0) : sum), 0);
    const start = toMin(slot.slice(0, 5));
    const win = values.surgeWindows.find((w) => w.startTime && w.endTime && start >= toMin(w.startTime) && start < toMin(w.endTime));
    const surge = win ? Math.round((base + addOns) * ((Number(win.percent) || 0) / 100)) : 0;
    const subtotal = base + addOns + surge;
    const gst = Math.round((subtotal + CONVENIENCE_FEE) * GST);
    return { n, base, addOns, surge, surgeLabel: win?.label, subtotal, gst, total: subtotal + CONVENIENCE_FEE + gst };
  }, [values, slot, qty, picked]);

  return (
    // Enter inside the preview must not submit the pricing form it sits in.
    <section className="cat-form__sec prc-vcard" aria-labelledby="qp-title" onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
      <div className="prc-vcard__head">
        <h3 id="qp-title">Quote preview</h3>
        <p>An estimate from the values you are editing. The server quote is the final price.</p>
      </div>

      <div className="prc-item__row prc-item__row--2">
        <label className="cat-field">
          <span>Slot</span>
          <select value={slot} onChange={(e) => setSlot(e.target.value)}>{SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </label>
        <label className="cat-field">
          <span>{values.mode === 'HOURLY' ? 'Hours' : 'Quantity'}</span>
          <input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(e.target.value)} />
        </label>
      </div>

      {values.addOns.length > 0 && (
        <fieldset className="prc-picks">
          <legend>Add-ons</legend>
          {values.addOns.map((a, i) => (
            <label key={i} className="prc-pick">
              <input type="checkbox" checked={picked.has(i)} onChange={() => setPicked((p) => { const next = new Set(p); if (next.has(i)) next.delete(i); else next.add(i); return next; })} />
              <span>{a.name || `Add-on ${i + 1}`}</span>
              <em>{rupees(Math.max(0, Number(a.price) || 0))}</em>
            </label>
          ))}
        </fieldset>
      )}

      <dl className="prc-bill">
        <Row label={values.mode === 'HOURLY' ? `Rate × ${q.n} h` : q.n > 1 ? `Base × ${q.n}` : 'Base'} value={rupees(q.base)} />
        {q.addOns > 0 && <Row label="Add-ons" value={rupees(q.addOns)} />}
        {q.surge > 0 && <Row label={q.surgeLabel || 'Surge'} value={rupees(q.surge)} />}
        <Row label="Convenience fee" value={rupees(CONVENIENCE_FEE)} muted />
        <Row label="GST (18%)" value={rupees(q.gst)} muted />
        <div className="prc-row prc-row--total"><dt>Total</dt><dd>{rupees(q.total)}</dd></div>
      </dl>
      <p className="prc-note">Cancellation fee: {rupees(Math.max(0, Number(values.cancellationFee) || 0))}</p>
    </section>
  );
};

export default QuotePreview;
