import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Inbox,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  UsersRound,
  X,
} from 'lucide-react';

import type { LeadSource, LeadStatus } from '@/features/public/leads';
import { fetchLead, fetchLeads, updateLeadStatus, type AdminLead } from '@/services/leadsApi';
import { InboxTabs } from '@/components/admin/InboxTabs';
import { Link } from 'react-router-dom';
import './Leads.css';

const dateTime = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const dateShort = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value));

const getErrorMessage = (error: unknown): string => {
  const status = typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : undefined;
  if (status === 401 || status === 403) return 'Your admin session may have expired. Sign in again to continue.';
  if (status === 404) return 'This lead is no longer available. Refresh the list and try again.';
  if (status && status >= 500) return 'Something went wrong on our side. Please try again.';
  if (!status) return 'We couldn’t connect to HomeCareX. Check your connection and try again.';
  return 'We couldn’t complete that request. Please review your selection and try again.';
};

const isAuthError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'status' in error && (error.status === 401 || error.status === 403);

const LeadSourceLabel: React.FC<{ source: LeadSource }> = ({ source }) => (
  <span className={`leads-source ${source === 'contact' ? 'leads-source--contact' : ''}`}>
    {source === 'partner' ? <BriefcaseBusiness aria-hidden="true" size={12} /> : <MessageSquareText aria-hidden="true" size={12} />}
    {source}
  </span>
);

const LeadStatusBadge: React.FC<{ status: LeadStatus }> = ({ status }) => {
  const icon = status === 'new'
    ? <CircleDot aria-hidden="true" size={11} />
    : status === 'contacted'
      ? <Clock3 aria-hidden="true" size={11} />
      : <CheckCircle2 aria-hidden="true" size={11} />;
  return <span className={`leads-status leads-status--${status}`}>{icon}{status}</span>;
};

const LeadAvatar: React.FC<{ name: string; source: LeadSource }> = ({ name, source }) => (
  <span aria-hidden="true" className={`leads-person__avatar ${source === 'partner' ? 'leads-person__avatar--partner' : ''}`}>
    {name.trim().slice(0, 1).toLocaleUpperCase() || <UsersRound size={14} />}
  </span>
);

const AdminLeadsPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<LeadSource | ''>('');
  const [status, setStatus] = useState<LeadStatus | ''>('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchValue.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const leadsQuery = useQuery({
    queryKey: ['admin-leads', { page, search, source, status }],
    queryFn: () => fetchLeads({ page, search, source, status }),
  });
  const detailQuery = useQuery({
    queryKey: ['admin-lead', selectedId],
    queryFn: () => fetchLead(selectedId ?? ''),
    enabled: Boolean(selectedId),
  });
  const statusMutation = useMutation({
    mutationFn: updateLeadStatus,
    onSuccess: async (updatedLead) => {
      setNotice('Lead status updated.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-leads'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-lead', updatedLead._id] }),
      ]);
    },
    onError: () => setNotice('Unable to update lead status. Please try again.'),
  });

  useEffect(() => {
    if (!selectedId) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedId(null);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      openerRef.current?.focus();
    };
  }, [selectedId]);

  const data = leadsQuery.data;
  const stats = data?.stats;
  const selectedLead = detailQuery.data;
  const hasFilters = Boolean(searchValue.trim() || source || status);
  const openLead = (id: string, opener: HTMLElement) => {
    openerRef.current = opener;
    setSelectedId(id);
  };
  const clearFilters = () => {
    setSearchValue('');
    setSearch('');
    setSource('');
    setStatus('');
    setPage(1);
  };
  const chooseStatus = (value: string) => {
    if (value === '' || value === 'new' || value === 'contacted' || value === 'closed') {
      setStatus(value);
      setPage(1);
    }
  };
  const leads = data?.leads ?? [];

  return (
    <div className="leads-workspace">
      <header className="leads-heading">
        <div>
          <div className="leads-heading__eyebrow"><BriefcaseBusiness aria-hidden="true" size={14} /> Operations / Lead management</div>
          <h1>Leads</h1>
          <p className="leads-heading__description">A clear view of customer enquiries and partner opportunities.</p>
        </div>
        <p className={`leads-heading__status ${leadsQuery.isError ? 'leads-heading__status--error' : ''}`}>
          <i aria-hidden="true" />
          {leadsQuery.isError ? (isAuthError(leadsQuery.error) ? 'Admin sign-in required' : 'Connection needs attention') : 'Lead workspace'}
        </p>
      </header>

      <InboxTabs />

      {notice && (
        <div role="status" className="leads-notice">
          <span><Check aria-hidden="true" size={15} />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification" className="leads-focus"><X size={15} /></button>
        </div>
      )}

      {stats ? (
        <section aria-label="Lead statistics" className="leads-metrics">
          <Metric label="Total leads" value={stats.total} icon={<UsersRound size={16} />} />
          <Metric label="New" value={stats.new} icon={<CircleDot size={16} />} tone="new" />
          <Metric label="Contacted" value={stats.contacted} icon={<MessageSquareText size={16} />} />
          <Metric label="Closed" value={stats.closed} icon={<CheckCircle2 size={16} />} tone="closed" />
          <Metric label="Partner interests" value={stats.partnerInterests} icon={<BriefcaseBusiness size={16} />} tone="partners" />
        </section>
      ) : leadsQuery.isLoading ? (
        <section aria-label="Loading lead statistics" className="leads-metrics leads-metrics--skeleton">
          {Array.from({ length: 5 }, (_, index) => <div key={index} className="leads-metric"><div><div className="leads-metric__label" /><div className="leads-metric__value" /></div></div>)}
        </section>
      ) : null}

      <section aria-label="Lead list" className="leads-board">
        <header className="leads-board__header">
          <div className="leads-board__heading">
            <h2>Enquiries</h2>
            <p>Review incoming requests and update their progress.</p>
          </div>
          <span className="leads-board__updated">{leadsQuery.isFetching ? <LoaderCircle aria-hidden="true" size={13} className="animate-spin" /> : <RefreshCw aria-hidden="true" size={12} />}{leadsQuery.isFetching ? 'Updating' : 'Enquiry inbox'}</span>
        </header>

        <div className="leads-toolbar">
          <label className="leads-search">
            <span className="sr-only">Search leads by name, email, phone, or city</span>
            <Search aria-hidden="true" size={15} />
            <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search leads..." />
          </label>
          <div className="leads-toolbar__filters">
            <div className="leads-source-tabs" role="group" aria-label="Filter by lead type">
              {([
                ['', 'All leads'],
                ['contact', 'Contact'],
                ['partner', 'Partner'],
              ] as const).map(([value, label]) => (
                <button key={label} type="button" aria-pressed={source === value} onClick={() => { setSource(value); setPage(1); }} className="leads-focus">{label}</button>
              ))}
            </div>
            <label className="leads-status-filter">
              <span className="sr-only">Filter by status</span>
              <select value={status} onChange={(event) => chooseStatus(event.target.value)} className="leads-focus">
                <option value="">All statuses</option><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option>
              </select>
            </label>
            {hasFilters && <button type="button" onClick={clearFilters} className="leads-clear leads-focus">Clear filters</button>}
          </div>
        </div>

        <div className="leads-board__meta">
          <span>{data ? `${data.pagination.total.toLocaleString('en-IN')} ${data.pagination.total === 1 ? 'lead' : 'leads'}` : 'Lead activity'}</span>
          {leadsQuery.isFetching && <span><LoaderCircle aria-hidden="true" size={12} className="animate-spin" /> Refreshing</span>}
        </div>

        {leadsQuery.isLoading ? (
          <LoadingLeads />
        ) : leadsQuery.isError ? (
          <div className="leads-state leads-state--error" role="alert">
            <span className="leads-state__icon"><AlertCircle aria-hidden="true" size={22} /></span>
            <h2>We couldn’t load your leads</h2>
            <p>{getErrorMessage(leadsQuery.error)}</p>
            {isAuthError(leadsQuery.error) ? (
              <Link to="/login?returnUrl=%2Fadmin%2Fleads" className="leads-state__link leads-focus">Sign in as an admin</Link>
            ) : (
              <button type="button" onClick={() => void leadsQuery.refetch()} className="leads-focus"><RefreshCw aria-hidden="true" size={13} /> Try again</button>
            )}
          </div>
        ) : data && leads.length > 0 ? (
          <>
            <div className="leads-table-wrap">
              <table className="leads-table">
                <thead><tr><th scope="col">Contact</th><th scope="col">Details</th><th scope="col">Enquiry / message</th><th scope="col">Type</th><th scope="col">Received</th><th scope="col">Status</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead._id}>
                      <td>
                        <div className="leads-person">
                          <LeadAvatar name={lead.name} source={lead.source} />
                          <div><div className="leads-person__name">{lead.name}</div><div className="leads-person__type">{lead.source === 'partner' ? 'Service partner' : 'Customer'}</div></div>
                        </div>
                      </td>
                      <td className="leads-table__contact">
                        {lead.email && <a href={`mailto:${lead.email}`}>{lead.email}</a>}
                        <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                        <span>{lead.city}</span>
                      </td>
                      <td><LeadSourceLabel source={lead.source} /></td>
                      <td>{dateShort(lead.createdAt)}</td>
                      <td className="leads-table__inquiry"><span>{lead.message ?? lead.skills?.join(', ') ?? 'Partner interest'}</span></td>
                      <td><LeadStatusBadge status={lead.status} /></td>
                      <td><button type="button" className="leads-row-action leads-focus" onClick={(event) => openLead(lead._id, event.currentTarget)}>View details</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="leads-mobile-list">
              {leads.map((lead) => (
                <button key={lead._id} type="button" className="leads-mobile-card leads-focus" onClick={(event) => openLead(lead._id, event.currentTarget)}>
                  <span className="leads-mobile-card__top">
                    <span className="leads-person">
                      <LeadAvatar name={lead.name} source={lead.source} />
                      <span><span className="leads-person__name">{lead.name}</span><span className="leads-person__type">{lead.city}</span></span>
                    </span>
                    <LeadStatusBadge status={lead.status} />
                  </span>
                  <span className="leads-mobile-card__details">
                    {lead.email && <span>{lead.email}</span>}<span>{lead.phone}</span>
                    <span className="leads-mobile-card__message">{lead.message ?? lead.skills?.join(', ') ?? 'Partner interest'}</span>
                  </span>
                  <span className="leads-mobile-card__bottom"><LeadSourceLabel source={lead.source} /><span>{dateShort(lead.createdAt)}</span></span>
                </button>
              ))}
            </div>

            <footer className="leads-pagination">
              <span>Page {data.pagination.page} of {Math.max(data.pagination.pages, 1)}</span>
              <div className="leads-pagination__controls">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="leads-focus"><ChevronLeft aria-hidden="true" size={16} /></button>
                <button type="button" aria-label="Next page" disabled={page >= data.pagination.pages} onClick={() => setPage((current) => current + 1)} className="leads-focus"><ChevronRight aria-hidden="true" size={16} /></button>
              </div>
            </footer>
          </>
        ) : (
          <div className="leads-state" role="status">
            <span className="leads-state__icon"><Inbox aria-hidden="true" size={22} /></span>
            <h2>{hasFilters ? 'No matching leads' : 'Your inbox is ready'}</h2>
            <p>{hasFilters ? 'Try a different search or clear your filters to see more enquiries.' : 'New contact messages and partner interests will appear here when they come in.'}</p>
            {hasFilters && <button type="button" onClick={clearFilters} className="leads-focus">Clear filters</button>}
          </div>
        )}
      </section>

      {selectedId && (
        <div className="leads-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedId(null); }}>
          <aside ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="lead-detail-title" className="leads-drawer">
            <header className="leads-drawer__header">
              <div>
                <p className="leads-drawer__eyebrow">Lead details</p>
                <h2 id="lead-detail-title">{selectedLead?.name ?? (detailQuery.isError ? 'Lead unavailable' : 'Loading lead')}</h2>
                {selectedLead && <div className="mt-2"><LeadSourceLabel source={selectedLead.source} /></div>}
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setSelectedId(null)} aria-label="Close lead details" className="leads-drawer__close leads-focus"><X aria-hidden="true" size={18} /></button>
            </header>
            <div className="leads-drawer__body">
              {detailQuery.isLoading ? (
                <div aria-label="Loading lead details" className="grid gap-3">
                  <div className="h-24 animate-pulse bg-slate-100" /><div className="h-32 animate-pulse bg-slate-100" /><div className="h-24 animate-pulse bg-slate-100" />
                </div>
              ) : detailQuery.isError ? (
                <div className="leads-state leads-state--error" role="alert">
                  <span className="leads-state__icon"><AlertCircle aria-hidden="true" size={22} /></span>
                  <h2>Unable to load lead details</h2>
                  <p>{getErrorMessage(detailQuery.error)}</p>
                  <button type="button" onClick={() => void detailQuery.refetch()} className="leads-focus">Try again</button>
                </div>
              ) : selectedLead ? (
                <LeadDetails
                  lead={selectedLead}
                  busy={statusMutation.isPending}
                  onStatusChange={(nextStatus) => statusMutation.mutate({ id: selectedLead._id, status: nextStatus })}
                />
              ) : null}
              {statusMutation.isError && <p role="alert" className="leads-error-notice">Unable to update lead status. Please try again.</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

const Metric: React.FC<{ label: string; value: number; icon: React.ReactNode; tone?: 'new' | 'closed' | 'partners' }> = ({ label, value, icon, tone }) => (
  <article className={`leads-metric ${tone ? `leads-metric--${tone}` : ''}`}>
    <div><p className="leads-metric__label">{label}</p><p className="leads-metric__value">{value.toLocaleString('en-IN')}</p></div>
    <span className="leads-metric__icon">{icon}</span>
  </article>
);

const LoadingLeads: React.FC = () => (
  <div className="leads-state" aria-label="Loading leads">
    <span className="leads-state__icon"><LoaderCircle aria-hidden="true" size={22} className="animate-spin" /></span>
    <h2>Loading enquiries</h2>
    <p>Fetching the latest lead activity.</p>
  </div>
);

const LeadDetails: React.FC<{ lead: AdminLead; busy: boolean; onStatusChange: (status: LeadStatus) => void }> = ({ lead, busy, onStatusChange }) => (
  <div className="leads-detail">
    <section className="leads-detail__section" aria-labelledby="lead-contact-heading">
      <h3 id="lead-contact-heading" className="leads-detail__label">Contact information</h3>
      <div className="leads-detail__contact">
        {lead.email && <a href={`mailto:${lead.email}`}><Mail aria-hidden="true" size={15} />{lead.email}</a>}
        <a href={`tel:${lead.phone}`}><Phone aria-hidden="true" size={15} />{lead.phone}</a>
        <p><MapPin aria-hidden="true" size={15} />{lead.city}</p>
      </div>
      <p className="leads-detail__date"><CalendarDays aria-hidden="true" size={13} /> Received {dateTime(lead.createdAt)}</p>
    </section>

    <section className="leads-detail__section" aria-labelledby="lead-interest-heading">
      <h3 id="lead-interest-heading" className="leads-detail__label">Enquiry type</h3>
      <div className="leads-detail__interest">
        <b>{lead.source === 'partner' ? 'Partner opportunity' : 'Customer enquiry'}</b>
        <p>{lead.source === 'partner' ? 'Interested in working with the HomeCareX network.' : 'Request for help from the HomeCareX team.'}</p>
      </div>
      {lead.skills?.length ? <div className="leads-detail__skills">{lead.skills.map((skill) => <span key={skill}>{skill}</span>)}</div> : null}
    </section>

    {lead.message && (
      <section className="leads-detail__section" aria-labelledby="lead-message-heading">
        <h3 id="lead-message-heading" className="leads-detail__label">Message</h3>
        <p className="leads-detail__message">{lead.message}</p>
      </section>
    )}

    <section className="leads-detail__section" aria-labelledby="lead-status-heading">
      <div className="leads-detail__status-head">
        <h3 id="lead-status-heading" className="leads-detail__label">Lead status</h3>
        <LeadStatusBadge status={lead.status} />
      </div>
      <div className="leads-detail__actions">
        <button type="button" onClick={() => onStatusChange('contacted')} disabled={busy || lead.status === 'contacted'} className="leads-focus">
          {busy ? <LoaderCircle aria-hidden="true" size={13} className="animate-spin" /> : <Phone aria-hidden="true" size={13} />} Mark contacted
        </button>
        <button type="button" onClick={() => onStatusChange(lead.status === 'closed' ? 'new' : 'closed')} disabled={busy} className="leads-focus">
          {lead.status === 'closed' ? 'Reopen lead' : 'Close lead'}
        </button>
      </div>
    </section>
  </div>
);

export default AdminLeadsPage;
