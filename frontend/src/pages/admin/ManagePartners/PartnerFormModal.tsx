import React, { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Modal } from '@/components/admin/Modal';
import { adminApi, type CreatePartnerInput, type Designation, type PartnerMember, type UpdatePartnerInput } from '../Services/adminApi';
import type { ApiError } from '@/lib/http';

const GMAIL_USERNAME = /^(?=.*[a-z])(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9.]{6,30}$/;

export function emailProblem(email: string): string {
  const v = email.trim().toLowerCase();
  if (!v.endsWith('@gmail.com')) return 'Only @gmail.com addresses are allowed.';
  if (!GMAIL_USERNAME.test(v.slice(0, -'@gmail.com'.length)))
    return 'Email name must be 6-30 characters (letters, numbers, dots) and include at least one letter. Numbers-only like 123@gmail.com is not allowed.';
  return '';
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400';

const EMPTY: CreatePartnerInput = { name: '', email: '', designation: '', phone: '', gender: '', password: '' };

interface Props {
  open: boolean;
  /** Hides the dialog without resetting the form (another dialog is on top). */
  suspended?: boolean;
  /** null = add a new partner, otherwise edit this one. */
  partner: PartnerMember | null;
  designations: Designation[];
  onClose: () => void;
  onManageDesignations: () => void;
  /** Called after a successful save. `message` is ready to show as a notice. */
  onSaved: (message: string, tone: 'success' | 'warning') => void;
}

export const PartnerFormModal: React.FC<Props> = ({ open, suspended, partner, designations, onClose, onManageDesignations, onSaved }) => {
  const editing = Boolean(partner);
  const [form, setForm] = useState<CreatePartnerInput>(EMPTY);
  const [status, setStatus] = useState<'active' | 'blocked'>('active');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset every time the dialog opens (for a different partner or for "add").
  useEffect(() => {
    if (!open) return;
    setError('');
    if (partner) {
      setForm({
        name: partner.name,
        email: partner.email,
        designation: partner.designation ?? '',
        phone: partner.phone ?? '',
        gender: partner.gender ?? '',
        password: '',
      });
      setStatus(partner.status);
    } else {
      setForm(EMPTY);
      setStatus('active');
    }
  }, [open, partner]);

  const set = (key: keyof CreatePartnerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // A partner whose designation was since removed still needs to show it in the select.
  const options = [...designations.map((d) => d.name)];
  if (form.designation && !options.some((n) => n.toLowerCase() === form.designation.toLowerCase())) options.push(form.designation);

  const close = () => {
    if (!saving) onClose();
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = emailProblem(form.email);
    if (problem) return setError(problem);
    setError('');
    setSaving(true);
    try {
      if (partner) {
        const changes: UpdatePartnerInput = {};
        if (form.name.trim() !== partner.name) changes.name = form.name.trim();
        if (form.email.trim().toLowerCase() !== partner.email) changes.email = form.email.trim();
        if (form.designation !== (partner.designation ?? '')) changes.designation = form.designation;
        if (form.phone.trim() !== (partner.phone ?? '')) changes.phone = form.phone.trim();
        if (form.gender && form.gender !== partner.gender) changes.gender = form.gender as 'male' | 'female' | 'other';
        if (status !== partner.status) changes.status = status;
        if (Object.keys(changes).length === 0) return onClose();
        await adminApi.updatePartner(partner.id, changes);
        onSaved(`${form.name.trim()} was updated.`, 'success');
      } else {
        const { emailSent } = await adminApi.createPartner(form);
        onSaved(
          emailSent
            ? `Partner registered. Credentials were emailed to ${form.email}.`
            : `Partner registered, but the email to ${form.email} failed. Share the credentials manually.`,
          emailSent ? 'success' : 'warning',
        );
      }
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.details?.[0]?.message || apiErr.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open && !suspended}
      onClose={close}
      title={editing ? 'Edit Partner' : 'Add Partner'}
      description={editing ? 'Update this partner’s details or block their access.' : 'Login credentials will be emailed to the partner.'}
      dismissible={!saving}
      footer={
        <>
          <button type="button" className="hcx-btn" onClick={close} disabled={saving}>
            Cancel
          </button>
          <button type="submit" form="partner-form" className="hcx-btn hcx-btn--primary" disabled={saving}>
            {saving ? (editing ? 'Saving…' : 'Registering…') : editing ? 'Save Changes' : 'Register & Send Email'}
          </button>
        </>
      }
    >
      <form id="partner-form" onSubmit={submit} className="space-y-3">
        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <label className="block text-sm font-medium">
          Name
          <input className={inputClass} value={form.name} onChange={set('name')} required />
        </label>

        <label className="block text-sm font-medium">
          Email
          <input className={inputClass} type="email" placeholder="name@gmail.com" value={form.email} onChange={set('email')} required />
        </label>

        <div className="block text-sm font-medium">
          <div className="flex items-center justify-between">
            <label htmlFor="partner-designation">Designation</label>
            <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline" onClick={onManageDesignations}>
              <Settings2 size={12} /> Manage list
            </button>
          </div>
          <select id="partner-designation" className={inputClass} value={form.designation} onChange={set('designation')} required>
            <option value="">Select specialist type</option>
            {options.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Phone
            <input className={inputClass} inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={form.phone} onChange={set('phone')} required />
          </label>
          <label className="block text-sm font-medium">
            Gender
            <select className={inputClass} value={form.gender} onChange={set('gender')} required>
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>

        {editing ? (
          <label className="block text-sm font-medium">
            Status
            <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'blocked')}>
              <option value="active">Active</option>
              <option value="blocked">Blocked (cannot sign in)</option>
            </select>
          </label>
        ) : (
          <label className="block text-sm font-medium">
            Password
            <input
              className={inputClass}
              type="text"
              autoComplete="off"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={form.password}
              onChange={set('password')}
              required
            />
          </label>
        )}
      </form>
    </Modal>
  );
};

export default PartnerFormModal;
