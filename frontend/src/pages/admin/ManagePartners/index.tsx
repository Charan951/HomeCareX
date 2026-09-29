import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Modal } from '@/components/admin/Modal';
import { adminApi, PARTNER_DESIGNATIONS, type CreatePartnerInput, type PartnerMember } from '@/services/adminApi';
import type { ApiError } from '@/lib/http';

const GMAIL_USERNAME = /^(?=.*[a-z])(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9.]{6,30}$/;

function emailProblem(email: string): string {
  const v = email.trim().toLowerCase();
  if (!v.endsWith('@gmail.com')) return 'Only @gmail.com addresses are allowed.';
  if (!GMAIL_USERNAME.test(v.slice(0, -'@gmail.com'.length)))
    return 'Email name must be 6-30 characters (letters, numbers, dots) and include at least one letter. Numbers-only like 123@gmail.com is not allowed.';
  return '';
}

const EMPTY_FORM: CreatePartnerInput = { name: '', email: '', designation: '', phone: '', gender: '', password: '' };

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400';

export const AdminManagePartnersPage: React.FC = () => {
  const [partners, setPartners] = useState<PartnerMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreatePartnerInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const loadPartners = useCallback(async () => {
    try {
      setPartners(await adminApi.listPartners());
      setLoadError('');
    } catch (e) {
      setLoadError((e as ApiError).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPartners();
  }, [loadPartners]);

  const set = (key: keyof CreatePartnerInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const closeModal = () => {
    if (saving) return;
    setOpen(false);
    setForm(EMPTY_FORM);
    setFormError('');
  };

    async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = emailProblem(form.email);
    if (problem) {
      setFormError(problem);
      return;
    }
    setFormError('');
    setSaving(true);
    try {
      const { emailSent } = await adminApi.createPartner(form);
      setNotice(
        emailSent
          ? `Partner registered. Credentials were emailed to ${form.email}.`
          : `Partner registered, but the email to ${form.email} failed. Share the credentials manually.`,
      );
      setOpen(false);
      setForm(EMPTY_FORM);
      loadPartners();
    } catch (err) {
      const apiErr = err as ApiError;
      // Show the first field-level message from the server if there is one.
      setFormError(apiErr.details?.[0]?.message || apiErr.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-page-container">
      <PageHeader
        title="Manage Partners"
        description="Register partners and email them their login credentials."
        actions={
          <button type="button" className="hcx-btn hcx-btn--primary" onClick={() => setOpen(true)}>
            <Plus size={16} /> Add Partner
          </button>
        }
      />

      {notice && (
        <div role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </div>
      )}
      {loadError && (
        <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {loadError}
        </div>
      )}

      <div className="hcx-table-card">
        <div className="hcx-table-scroll">
          <table className="hcx-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Gender</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}>Loading…</td></tr>
              ) : partners.length === 0 ? (
                <tr><td colSpan={6}>No partners yet. Click “Add Partner” to register one.</td></tr>
              ) : (
                partners.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.designation ?? '—'}</td>
                    <td>{s.email}</td>
                    <td>{s.phone ?? '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.gender ?? '—'}</td>
                    <td style={{ textTransform: 'capitalize' }}>{s.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={open}
        onClose={closeModal}
        title="Add Partner"
        description="Login credentials will be emailed to the partner."
        dismissible={!saving}
        footer={
          <>
            <button type="button" className="hcx-btn" onClick={closeModal} disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="add-partner-form" className="hcx-btn hcx-btn--primary" disabled={saving}>
              {saving ? 'Registering…' : 'Register & Send Email'}
            </button>
          </>
        }
      >
        <form id="add-partner-form" onSubmit={handleSubmit} className="space-y-3">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {formError}
            </div>
          )}

          <label className="block text-sm font-medium">
            Name
            <input className={inputClass} value={form.name} onChange={set('name')} required />
          </label>

          <label className="block text-sm font-medium">
            Email
                       <input
              className={inputClass}
              type="email"
              placeholder="name@gmail.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </label>

          <label className="block text-sm font-medium">
            Designation
            <select className={inputClass} value={form.designation} onChange={set('designation')} required>
              <option value="">Select specialist type</option>
              {PARTNER_DESIGNATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Phone
              <input
                className={inputClass}
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile"
                value={form.phone}
                onChange={set('phone')}
                required
              />
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
        </form>
      </Modal>
    </div>
  );
};

export default AdminManagePartnersPage;
