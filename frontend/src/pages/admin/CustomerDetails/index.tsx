import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarCheck, IndianRupee, LifeBuoy, Pencil, Star, Trash2 } from 'lucide-react';

import { ConfirmDialog, Modal, PageHeader, StatCard, StatusBadge, Timeline } from '@/components/admin';
import type { TimelineItem } from '@/components/admin';
import { adminCustomerApi } from '@/services/adminCustomerApi';
import type { AdminCustomerDetail, CustomerOverview, CustomerStatus } from '@/types/adminCustomer';

import './index.css';

type TabId = 'overview' | 'bookings' | 'addresses' | 'payments' | 'activity' | 'support' | 'reviews';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'bookings', label: 'Bookings' },
  { id: 'addresses', label: 'Addresses' },
  { id: 'payments', label: 'Payments' },
  { id: 'activity', label: 'Activity' },
  { id: 'support', label: 'Support' },
  { id: 'reviews', label: 'Reviews' },
];

const LIST_CAP = 50; // keep in sync with DETAIL_TAB_LIMIT in the backend

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
/** "pending_payment" -> "Pending payment" (StatusBadge colours by the lower-cased text, so unknown ones fall back to neutral). */
const humanize = (v: string) => {
  const t = v.replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const errMessage = (e: unknown, fallback: string) => (e as { message?: string } | null)?.message || fallback;

/* ---------------- small building blocks ---------------- */

const Table: React.FC<{ label: string; head: string[]; empty: string; capped?: boolean; children: React.ReactNode; rows: number }> = ({
  label, head, empty, capped, children, rows,
}) => (
  <div className="cd-tablewrap">
    {capped && <p className="cd-note">Showing the latest {LIST_CAP}.</p>}
    <div className="hcx-table-card">
      <div className="hcx-table-scroll">
        <table className="hcx-table cd-table" aria-label={label}>
          <thead>
            <tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows === 0 ? (
              <tr><td colSpan={head.length}><div className="hcx-empty"><p><strong>{empty}</strong></p></div></td></tr>
            ) : children}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const Empty: React.FC<{ text: string }> = ({ text }) => (
  <div className="hcx-card"><div className="hcx-empty"><p><strong>{text}</strong></p></div></div>
);

/* ---------------- tab panels ---------------- */

const OverviewTab: React.FC<{ data: AdminCustomerDetail }> = ({ data }) => {
  const { overview: o } = data;
  return (
    <>
      <div className="cd-grid">
        <StatCard label="Bookings" value={o.stats.bookingsCount} icon={CalendarCheck} hint={`${o.stats.completedCount} completed, ${o.stats.cancelledCount} cancelled`} />
        <StatCard label="Lifetime value" value={inr.format(o.stats.ltv)} icon={IndianRupee} tone="success" hint="Paid bookings only" />
        <StatCard label="Open tickets" value={o.stats.openTickets} icon={LifeBuoy} tone={o.stats.openTickets > 0 ? 'warning' : 'neutral'} />
        <StatCard label="Reviews" value={o.stats.reviewsCount} icon={Star} tone="info" />
      </div>
      <section className="hcx-card cd-profile" aria-label="Profile">
        <h2 className="hcx-card__title">Profile</h2>
        <dl>
          <div><dt>Name</dt><dd>{o.name}</dd></div>
          <div><dt>Email</dt><dd>{o.email}</dd></div>
          <div><dt>Phone</dt><dd>{o.phone ?? '—'}</dd></div>
          <div><dt>Status</dt><dd><StatusBadge status={o.status === 'blocked' ? 'Blocked' : 'Active'} /></dd></div>
          <div><dt>Joined</dt><dd>{fmtDate(o.createdAt)}</dd></div>
          <div><dt>Last login</dt><dd>{o.lastLoginAt ? fmtDateTime(o.lastLoginAt) : 'Never'}</dd></div>
          <div><dt>Last activity</dt><dd>{o.lastActivityAt ? fmtDateTime(o.lastActivityAt) : 'Never'}</dd></div>
        </dl>
      </section>
    </>
  );
};

const BookingsTab: React.FC<{ data: AdminCustomerDetail }> = ({ data }) => (
  <Table label="Bookings" head={['Service', 'Scheduled', 'Status', 'Payment', 'Total']} empty="No bookings yet" capped={data.overview.stats.bookingsCount > LIST_CAP} rows={data.bookings.length}>
    {data.bookings.map((b) => (
      <tr key={b.id}>
        <td className="cd-title">{b.serviceName}</td>
        <td data-label="Scheduled">{fmtDateTime(b.scheduledAt ?? b.createdAt)}</td>
        <td data-label="Status"><StatusBadge status={humanize(b.status)} /></td>
        <td data-label="Payment"><StatusBadge status={humanize(b.paymentStatus)} /></td>
        <td data-label="Total" className="cd-num">{inr.format(b.total)}</td>
      </tr>
    ))}
  </Table>
);

const AddressesTab: React.FC<{ data: AdminCustomerDetail }> = ({ data }) =>
  data.addresses.length === 0 ? (
    <Empty text="No saved addresses" />
  ) : (
    <div className="cd-addresses">
      {data.addresses.map((a) => (
        <article key={a.id} className="hcx-card cd-address">
          <div className="cd-address__label">
            <span>{a.label}</span>
            {a.isDefault && <StatusBadge status="Default" tone="brand" dot={false} />}
          </div>
          <div>{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
          {a.landmark && <div className="cd-muted">Near {a.landmark}</div>}
          <div>{a.city}, {a.state} {a.pincode}</div>
        </article>
      ))}
    </div>
  );

const PaymentsTab: React.FC<{ data: AdminCustomerDetail }> = ({ data }) => (
  <Table label="Payments" head={['Amount', 'Date', 'Method', 'Status', 'Refund']} empty="No payments yet" capped={data.payments.length >= LIST_CAP} rows={data.payments.length}>
    {data.payments.map((p) => (
      <tr key={p.id}>
        <td className="cd-title cd-num">{inr.format(p.amount)}</td>
        <td data-label="Date">{fmtDateTime(p.paidAt ?? p.createdAt)}</td>
        <td data-label="Method">{p.method ? humanize(p.method) : <span className="cd-muted">—</span>}</td>
        <td data-label="Status"><StatusBadge status={humanize(p.status)} /></td>
        <td data-label="Refund">{p.refundStatus === 'none' ? <span className="cd-muted">—</span> : <StatusBadge status={humanize(p.refundStatus)} />}</td>
      </tr>
    ))}
  </Table>
);

const ActivityTab: React.FC<{ data: AdminCustomerDetail }> = ({ data }) => {
  const { overview: o } = data;
  const items: TimelineItem[] = [
    ...data.activity.map<TimelineItem>((a) => ({
      id: a.id,
      title: a.action === 'CUSTOMER_BLOCKED' ? 'Customer blocked' : a.action === 'CUSTOMER_UNBLOCKED' ? 'Customer unblocked' : humanize(a.action.toLowerCase()),
      description: a.reason ? `Reason: ${a.reason}` : undefined,
      actor: a.actor ?? undefined,
      time: fmtDateTime(a.at),
      tone: a.action === 'CUSTOMER_BLOCKED' ? 'danger' : a.action === 'CUSTOMER_UNBLOCKED' ? 'success' : 'neutral',
    })),
    ...(o.lastLoginAt ? [{ id: 'last-login', title: 'Last login', time: fmtDateTime(o.lastLoginAt), tone: 'info' as const }] : []),
    { id: 'created', title: 'Account created', time: fmtDateTime(o.createdAt), tone: 'brand' },
  ];
  return <div className="hcx-card" style={{ padding: 18 }}><Timeline items={items} /></div>;
};

const SupportTab: React.FC<{ data: AdminCustomerDetail }> = ({ data }) => (
  <Table label="Support tickets" head={['Subject', 'Category', 'Priority', 'Status', 'Last message']} empty="No support tickets" capped={data.support.length >= LIST_CAP} rows={data.support.length}>
    {data.support.map((t) => (
      <tr key={t.id}>
        <td className="cd-title"><span className="cd-wrap">{t.subject}</span></td>
        <td data-label="Category">{humanize(t.category)}</td>
        <td data-label="Priority">{humanize(t.priority)}</td>
        <td data-label="Status"><StatusBadge status={humanize(t.status)} /></td>
        <td data-label="Last message">{fmtDateTime(t.lastMessageAt)}</td>
      </tr>
    ))}
  </Table>
);

const ReviewsTab: React.FC<{ data: AdminCustomerDetail }> = ({ data }) =>
  data.reviews.length === 0 ? (
    <Empty text="No reviews yet" />
  ) : (
    <div>
      {data.reviews.map((r) => (
        <article key={r.id} className="hcx-card cd-review">
          <div className="cd-review__head">
            <span className="cd-stars" role="img" aria-label={`${r.rating} out of 5 stars`}>
              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
            </span>
            <StatusBadge status={humanize(r.status)} />
            <span className="cd-muted">{fmtDate(r.createdAt)}</span>
          </div>
          <p>{r.message}</p>
        </article>
      ))}
    </div>
  );

/** Edit name / email / phone (same fields and rules as the Customers list). */
const EditCustomerModal: React.FC<{ customer: CustomerOverview; open: boolean; onClose: () => void; onSaved: () => void }> = ({
  customer, open, onClose, onSaved,
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Start from the latest saved values every time the dialog opens.
  useEffect(() => {
    if (open) {
      setName(customer.name);
      setEmail(customer.email);
      setPhone(customer.phone ?? '');
      setError(null);
    }
  }, [open, customer]);

  const mutation = useMutation({
    mutationFn: () => adminCustomerApi.update(customer.id, { name: name.trim(), email: email.trim(), phone: phone.trim() }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      onSaved();
    },
    onError: (e) => setError(errMessage(e, 'Could not save the changes. Please try again.')),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return setError('Name must be at least 2 characters');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email');
    if (phone.trim() && !/^[6-9]\d{9}$/.test(phone.trim())) return setError('Enter a valid 10-digit mobile number');
    setError(null);
    mutation.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit customer"
      size="sm"
      dismissible={!mutation.isPending}
      footer={
        <>
          <button type="button" className="hcx-btn" onClick={onClose} disabled={mutation.isPending}>Cancel</button>
          <button type="submit" form="cd-edit-form" className="hcx-btn hcx-btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <form id="cd-edit-form" className="cd-form" onSubmit={submit} noValidate>
        <label className="hcx-field"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" /></label>
        <label className="hcx-field"><span>Email</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></label>
        <label className="hcx-field"><span>Phone</span><input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="10-digit mobile (optional)" autoComplete="off" /></label>
        {error && <div role="alert" className="cd-form__error">{error}</div>}
      </form>
    </Modal>
  );
};

/* ---------------- page ---------------- */

const AdminCustomerDetailsPage: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabId>('overview');
  const [confirmTo, setConfirmTo] = useState<CustomerStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const query = useQuery({
    queryKey: ['admin', 'customers', 'detail', id],
    queryFn: ({ signal }) => adminCustomerApi.get(id, signal),
    enabled: Boolean(id),
    retry: (count, err) => (err as { status?: number })?.status !== 404 && count < 2,
  });

  const mutation = useMutation({
    mutationFn: (input: { status: CustomerStatus; reason: string }) => adminCustomerApi.updateStatus(id, input),
    onSuccess: async (result) => {
      setConfirmTo(null);
      setActionError(null);
      setNotice(result.status === 'blocked' ? 'Customer blocked. Their sessions were signed out.' : 'Customer unblocked.');
      // Refetch the detail (new status, activity entry) and the list (status column) so neither shows stale data.
      await queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
    onError: (e) => {
      // 409 means someone else already changed it; reload so the button matches reality.
      setActionError(errMessage(e, 'Could not update the customer. Please try again.'));
      if ((e as { status?: number })?.status === 409) void queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (reason: string) => adminCustomerApi.remove(id, reason),
    onSuccess: async () => {
      setRemoveOpen(false);
      setRemoveError(null);
      // The customer no longer exists, so drop the cached detail and go back to the list.
      queryClient.removeQueries({ queryKey: ['admin', 'customers', 'detail', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      navigate('/admin/customers');
    },
    onError: (e) => setRemoveError(errMessage(e, 'Could not remove the customer. Please try again.')),
  });

  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    const next = e.key === 'ArrowRight' ? index + 1 : e.key === 'ArrowLeft' ? index - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : null;
    if (next === null) return;
    e.preventDefault();
    const target = TABS[(next + TABS.length) % TABS.length].id;
    setTab(target);
    tabRefs.current[target]?.focus();
  };

  /* ---- loading / error / not found ---- */
  if (query.isPending) {
    return (
      <div className="admin-page-container cd-page" aria-busy="true">
        <PageHeader title="Customer" back="/admin/customers" />
        <div className="cd-grid">
          {[0, 1, 2, 3].map((n) => <StatCard key={n} label="" value="" loading />)}
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    const notFound = (query.error as { status?: number } | null)?.status === 404;
    return (
      <div className="admin-page-container cd-page">
        <PageHeader title="Customer" back="/admin/customers" />
        <div className="hcx-card cd-state" role="alert">
          <h2>{notFound ? 'Customer not found' : 'Unable to load this customer'}</h2>
          <p>{notFound ? 'This customer does not exist or was removed.' : errMessage(query.error, 'Please try again.')}</p>
          {notFound ? (
            <button type="button" className="hcx-btn" onClick={() => navigate('/admin/customers')}>Back to customers</button>
          ) : (
            <button type="button" className="hcx-btn hcx-btn--primary" onClick={() => void query.refetch()}>Retry</button>
          )}
        </div>
      </div>
    );
  }

  const data = query.data;
  const { overview: o } = data;
  const isBlocked = o.status === 'blocked';
  const counts: Partial<Record<TabId, number>> = {
    bookings: o.stats.bookingsCount,
    addresses: data.addresses.length,
    payments: data.payments.length,
    support: data.support.length,
    reviews: o.stats.reviewsCount,
  };

  const panel: Record<TabId, React.ReactNode> = {
    overview: <OverviewTab data={data} />,
    bookings: <BookingsTab data={data} />,
    addresses: <AddressesTab data={data} />,
    payments: <PaymentsTab data={data} />,
    activity: <ActivityTab data={data} />,
    support: <SupportTab data={data} />,
    reviews: <ReviewsTab data={data} />,
  };

  return (
    <div className="admin-page-container cd-page">
      <PageHeader
        title={o.name}
        description={[o.email, o.phone].filter(Boolean).join(' · ')}
        back="/admin/customers"
        meta={<StatusBadge status={isBlocked ? 'Blocked' : 'Active'} />}
        actions={
          <div className="cd-actions">
            <button
              type="button"
              className="cd-action cd-action--edit hcx-btn"
              onClick={() => { setNotice(null); setEditOpen(true); }}
            >
              <Pencil size={14} aria-hidden /> Edit
            </button>
            <button
              type="button"
              className="cd-action cd-action--remove hcx-btn"
              onClick={() => { setNotice(null); setRemoveError(null); setRemoveOpen(true); }}
            >
              <Trash2 size={14} aria-hidden /> Remove
            </button>
            <button
              type="button"
              className={`cd-action ${isBlocked ? 'hcx-btn hcx-btn--primary' : 'hcx-btn hcx-btn--danger'}`}
              onClick={() => { setActionError(null); setNotice(null); setConfirmTo(isBlocked ? 'active' : 'blocked'); }}
            >
              {isBlocked ? 'Unblock customer' : 'Block customer'}
            </button>
          </div>
        }
      />

      {notice && <div className="cd-banner cd-banner--ok" role="status">{notice}</div>}
      {isBlocked && (
        <div className="cd-banner cd-banner--blocked" role="status">
          <strong>This customer is blocked and cannot sign in.</strong>
          {o.statusChange?.status === 'blocked' && (
            <span>
              {o.statusChange.by ? `By ${o.statusChange.by}, ` : ''}{fmtDateTime(o.statusChange.at)}
              {o.statusChange.reason ? `. Reason: ${o.statusChange.reason}` : ''}
            </span>
          )}
        </div>
      )}

      <div className="cd-tabs" role="tablist" aria-label="Customer sections">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { tabRefs.current[t.id] = el; }}
            id={`cd-tab-${t.id}`}
            type="button"
            role="tab"
            className="cd-tab"
            aria-selected={tab === t.id}
            aria-controls={`cd-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKey(e, i)}
          >
            {t.label}
            {counts[t.id] !== undefined && <span className="cd-tab__count">{counts[t.id]}</span>}
          </button>
        ))}
      </div>

      <div id={`cd-panel-${tab}`} role="tabpanel" aria-labelledby={`cd-tab-${tab}`} tabIndex={0}>
        {panel[tab]}
      </div>

      <ConfirmDialog
        open={confirmTo !== null}
        tone={confirmTo === 'blocked' ? 'danger' : 'primary'}
        title={confirmTo === 'blocked' ? `Block ${o.name}?` : `Unblock ${o.name}?`}
        confirmLabel={confirmTo === 'blocked' ? 'Block customer' : 'Unblock customer'}
        loading={mutation.isPending}
        reason={{
          label: 'Reason',
          required: true,
          placeholder: confirmTo === 'blocked' ? 'Why is this customer being blocked?' : 'Why is this customer being unblocked?',
        }}
        message={
          <>
            {confirmTo === 'blocked'
              ? 'They will be signed out of every device and will not be able to log in or book until unblocked.'
              : 'They will be able to log in and book again.'}
            {actionError && <div role="alert" style={{ marginTop: 8, color: 'var(--hcx-danger)' }}>{actionError}</div>}
          </>
        }
        onCancel={() => { if (!mutation.isPending) { setConfirmTo(null); setActionError(null); } }}
        onConfirm={(reason) => {
          if (confirmTo && reason) mutation.mutate({ status: confirmTo, reason });
        }}
      />

      <EditCustomerModal
        customer={o}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={() => { setEditOpen(false); setNotice('Customer details updated.'); }}
      />

      <ConfirmDialog
        open={removeOpen}
        tone="danger"
        title={`Remove ${o.name}?`}
        confirmLabel="Remove customer"
        loading={removeMutation.isPending}
        reason={{ label: 'Reason', required: true, placeholder: 'Why is this customer being removed?' }}
        message={
          <>
            This permanently deletes the customer and their saved addresses. Customers with bookings can't be removed; block them instead.
            {removeError && <div role="alert" style={{ marginTop: 8, color: 'var(--hcx-danger)' }}>{removeError}</div>}
          </>
        }
        onCancel={() => { if (!removeMutation.isPending) { setRemoveOpen(false); setRemoveError(null); } }}
        onConfirm={(reason) => { if (reason) removeMutation.mutate(reason); }}
      />
    </div>
  );
};

export default AdminCustomerDetailsPage;