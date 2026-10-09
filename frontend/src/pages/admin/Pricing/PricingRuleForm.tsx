import React, { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { FullScreenPanel } from '@/components/admin/FullScreenPanel';
import type { CategoryOption, PricingFormErrors, PricingFormValues, PricingMode, PricingRule, PricingRuleInput, ServiceOption } from '@/types/adminPricing';
import AddOnEditor, { MAX_ADDONS } from './AddOnEditor';
import SurgeWindowEditor, { MAX_SURGE } from './SurgeWindowEditor';
import QuotePreview from './QuotePreview';
import { cityKey, normalizeCity } from '@/services/adminPricingApi';
import { validatePricing } from './validate';

interface Props {
  open: boolean;
  editing: PricingRule | null;
  categories: CategoryOption[];
  services: ServiceOption[];
  /** Every saved rule, used to stop a new rule from silently replacing one with the same scope. */
  rules: PricingRule[];
  /** Cities already used in rules, offered as suggestions. */
  cities: string[];
  saving: boolean;
  serverError: string;
  /** Field messages from the server, keyed by form path. */
  serverFields?: PricingFormErrors;
  onClose: () => void;
  onSubmit: (input: PricingRuleInput) => void;
}

const MODES: { value: PricingMode; label: string }[] = [
  { value: 'FIXED', label: 'Fixed' },
  { value: 'HOURLY', label: 'Hourly' },
];

const emptyValues = (): PricingFormValues => ({
  mode: 'FIXED', basePrice: '', durationMinutes: '60', cancellationFee: '0', active: true, addOns: [], surgeWindows: [],
});
const fromRule = (r: PricingRule): PricingFormValues => ({
  mode: r.mode,
  basePrice: String(r.basePrice),
  durationMinutes: String(r.durationMinutes),
  cancellationFee: String(r.cancellationFee),
  active: r.active,
  addOns: r.addOns.map((a) => ({ name: a.name, price: String(a.price) })),
  surgeWindows: r.surgeWindows.map((w) => ({ ...w, percent: String(w.percent) })),
});

/** Create / edit one pricing rule. Scope (category, service, city) is fixed once a rule exists: changing it would be a different rule. */
export const PricingRuleForm: React.FC<Props> = ({ open, editing, categories, services, rules, cities, saving, serverError, serverFields, onClose, onSubmit }) => {
  const [categoryId, setCategoryId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [city, setCity] = useState('');
  const [values, setValues] = useState<PricingFormValues>(emptyValues);
  const [touched, setTouched] = useState(false);
  const [fromServer, setFromServer] = useState<PricingFormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setFromServer({});
    setCategoryId(editing?.categoryId ?? '');
    setServiceId(editing?.serviceId ?? '');
    setCity(editing?.city ?? '');
    setValues(editing ? fromRule(editing) : emptyValues());
  }, [open, editing]);
  useEffect(() => setFromServer(serverFields ?? {}), [serverFields]);

  const scope = useMemo(() => ({ categoryId, serviceId: serviceId || null, city: normalizeCity(city) }), [categoryId, serviceId, city]);
  const result = useMemo(() => validatePricing(scope, values), [scope, values]);

  const duplicate = !editing && categoryId !== '' && rules.some((r) => r.categoryId === scope.categoryId && (r.serviceId ?? null) === scope.serviceId && cityKey(r.city) === cityKey(scope.city));
  const errors: PricingFormErrors = { ...(touched ? result.errors : {}), ...fromServer };
  if (duplicate) errors.scope = 'A rule already exists for this category, service and city. Edit it from the table instead.';

  const categoryServices = services.filter((s) => s.categoryId === categoryId);
  const selectable = categories.filter((c) => c.active || c.id === categoryId);
  const set = <K extends keyof PricingFormValues>(k: K, v: PricingFormValues[K]) => { setFromServer({}); setValues((p) => ({ ...p, [k]: v })); };

  const chooseService = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    // Start a new rule from the service's current price and duration, but never overwrite what the admin typed.
    if (svc && !editing) setValues((p) => ({ ...p, basePrice: p.basePrice === '' ? String(svc.basePrice) : p.basePrice, durationMinutes: p.durationMinutes === '60' ? String(svc.durationMinutes) : p.durationMinutes }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setFromServer({});
    if (!result.input || duplicate) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    // Same city in a different letter case is the same city: keep the spelling already used by saved rules.
    const known = cities.find((c) => cityKey(c) === cityKey(result.input!.city));
    onSubmit(known ? { ...result.input, city: known } : result.input);
  };

  const err = (k: string) => (errors[k] ? <small className="cat-err" role="alert">{errors[k]}</small> : null);
  const bad = (k: string) => Boolean(errors[k]);
  const locked = saving;
  const scopeLocked = locked || Boolean(editing);
  const cityListId = 'prc-city-list';
  const priceLabel = values.mode === 'HOURLY' ? 'Rate per hour (₹) *' : 'Base price (₹) *';

  return (
    <FullScreenPanel
      open={open} onClose={() => !saving && onClose()}
      title={editing ? 'Edit pricing rule' : 'Create pricing rule'}
      subtitle={editing ? 'Changes are written to the audit log. Scope cannot be changed: create a new rule for another scope.' : 'The most specific active rule wins when a customer gets a quote.'}
      footer={
        <>
          <button type="button" className="hcx-btn" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="pricing-form" className="hcx-btn hcx-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create rule'}
          </button>
        </>
      }
    >
      <form id="pricing-form" ref={formRef} className="cat-form prc-form" onSubmit={submit} noValidate>
        {serverError && <div role="alert" className="cat-alert">{serverError}</div>}

        <section className="cat-form__sec">
          <h3>Service &amp; scope <small>who this rule applies to</small></h3>
          <div className="prc-grid2">
            <label className="cat-field">
              <span>Category *</span>
              <select value={categoryId} disabled={scopeLocked} aria-invalid={bad('categoryId') || bad('scope')} autoFocus={!editing}
                onChange={(e) => { setCategoryId(e.target.value); setServiceId(''); }}>
                <option value="">Select a category…</option>
                {selectable.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? '' : ' (inactive)'}</option>)}
              </select>
              {err('categoryId')}
            </label>
            <label className="cat-field">
              <span>Service</span>
              <select value={serviceId} disabled={scopeLocked || !categoryId} aria-invalid={bad('serviceId') || bad('scope')} onChange={(e) => chooseService(e.target.value)}>
                <option value="">All services in category</option>
                {categoryServices.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {err('serviceId')}
            </label>
          </div>
          <label className="cat-field">
            <span>City rule <small>{city.length}/100</small></span>
            <input value={city} maxLength={100} list={cityListId} disabled={scopeLocked} placeholder="All cities" aria-invalid={bad('city') || bad('scope')} onChange={(e) => setCity(e.target.value)} />
            <datalist id={cityListId}>{cities.map((c) => <option key={c} value={c} />)}</datalist>
            <small className="cat-hint">Leave empty for every city. A city rule beats the all-cities rule for customers in that city.</small>
            {err('city')}
          </label>
          {errors.scope && <small className="cat-err" role="alert">{errors.scope}</small>}
        </section>

        <section className="cat-form__sec">
          <div className="prc-sechead">
            <h3>Pricing</h3>
            <div role="radiogroup" aria-label="Pricing mode" className="prc-seg">
              {MODES.map((m) => (
                <button key={m.value} type="button" role="radio" aria-checked={values.mode === m.value} disabled={locked}
                  className={clsx(values.mode === m.value && 'is-on')} onClick={() => set('mode', m.value)}>{m.label}</button>
              ))}
            </div>
          </div>
          <div className="prc-grid3">
            <label className="cat-field">
              <span>{priceLabel}</span>
              <input type="number" inputMode="numeric" min={0} step={1} value={values.basePrice} disabled={locked} aria-invalid={bad('basePrice')} onChange={(e) => set('basePrice', e.target.value)} />
              {err('basePrice')}
            </label>
            <label className="cat-field">
              <span>Duration (min) *</span>
              <input type="number" inputMode="numeric" min={5} step={5} value={values.durationMinutes} disabled={locked} aria-invalid={bad('durationMinutes')} onChange={(e) => set('durationMinutes', e.target.value)} />
              {err('durationMinutes')}
            </label>
            <label className="cat-field">
              <span>Cancellation fee (₹)</span>
              <input type="number" inputMode="numeric" min={0} step={1} value={values.cancellationFee} disabled={locked} aria-invalid={bad('cancellationFee')} onChange={(e) => set('cancellationFee', e.target.value)} />
              {err('cancellationFee')}
            </label>
          </div>
          <div className="cat-switchrow">
            <div><strong>{values.active ? 'Active' : 'Inactive'}</strong><small>{values.active ? 'Used when customers get a quote.' : 'Ignored at quote time until you turn it on.'}</small></div>
            <button type="button" role="switch" aria-checked={values.active} aria-label="Rule active" className={clsx('cat-switch', values.active && 'is-on')} onClick={() => set('active', !values.active)} disabled={locked}><span /></button>
          </div>
        </section>

        <div className="prc-cols">
          <section className="cat-form__sec prc-vcard" aria-labelledby="pf-addons">
            <div className="prc-vcard__head">
              <h3 id="pf-addons">Add-ons <small>{values.addOns.length}/{MAX_ADDONS}</small></h3>
              <p>Optional extras with their own price.</p>
            </div>
            <AddOnEditor addOns={values.addOns} errors={errors} disabled={locked} onChange={(a) => set('addOns', a)} />
          </section>

          <section className="cat-form__sec prc-vcard" aria-labelledby="pf-surge">
            <div className="prc-vcard__head">
              <h3 id="pf-surge">Surge windows <small>{values.surgeWindows.length}/{MAX_SURGE}</small></h3>
              <p>Slots starting inside a window cost the chosen % more.</p>
            </div>
            <SurgeWindowEditor windows={values.surgeWindows} errors={errors} disabled={locked} onChange={(w) => set('surgeWindows', w)} />
          </section>

          <QuotePreview values={values} />
        </div>
      </form>
    </FullScreenPanel>
  );
};

export default PricingRuleForm;
