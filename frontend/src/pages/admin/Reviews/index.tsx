import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  MessageSquareText,
  Search,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { InboxTabs } from '@/components/admin/InboxTabs';
import { fetchAdminReviews, updateReviewStatus, type CustomerReview, type ReviewStatus } from '@/services/reviewsApi';

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

const dateTime = (value: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const isAuthError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'status' in error && (error.status === 401 || error.status === 403);

const ReviewStatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold ${
    status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : status === 'rejected' ? 'border-red-200 bg-red-50 text-red-800'
        : 'border-amber-200 bg-amber-50 text-amber-800'
  }`}>
    {status === 'approved' ? <CheckCircle2 aria-hidden="true" size={13} /> : <Clock3 aria-hidden="true" size={13} />}
    {statusLabels[status]}
  </span>
);

const AdminReviewsPage: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReviewStatus | ''>('pending');
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchValue.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchValue]);

  const reviewsQuery = useQuery({
    queryKey: ['admin-reviews', { page, search, status }],
    queryFn: () => fetchAdminReviews({ page, search, status }),
  });
  const statusMutation = useMutation({
    mutationFn: updateReviewStatus,
    onSuccess: async (review) => {
      setNotice(`Review ${review.status === 'approved' ? 'approved' : review.status === 'rejected' ? 'rejected' : 'returned to pending'}.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
        queryClient.invalidateQueries({ queryKey: ['customer-reviews', review.customerId] }),
        queryClient.invalidateQueries({ queryKey: ['customer-reviews'] }),
      ]);
    },
    onError: () => setNotice('Unable to update review validation. Please try again.'),
  });

  const data = reviewsQuery.data;
  const hasSearch = Boolean(searchValue.trim());
  const hasReviewFilter = hasSearch || (status !== '' && status !== 'pending');
  const clearFilters = () => {
    setSearchValue('');
    setSearch('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="mb-6 border-b border-slate-200 pb-6">
        <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-500"><Star aria-hidden="true" size={15} className="text-[#4338ca]" /> Quality / Customer feedback</p>
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-[2.5rem]">Inbox</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Validate customer reviews alongside contact and partner enquiries.</p>
      </header>

      <InboxTabs />

      {notice && (
        <div role="status" className={`mb-5 flex items-center justify-between gap-3 border px-4 py-3 text-sm ${statusMutation.isError ? 'border-red-200 bg-red-50 text-red-900' : 'border-indigo-200 bg-indigo-50 text-indigo-950'}`}>
          <span className="flex items-center gap-2"><Check aria-hidden="true" size={16} />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-semibold underline underline-offset-2">Dismiss</button>
        </div>
      )}

      {data ? (
        <section aria-label="Review validation totals" className="mb-6 grid grid-cols-2 border border-slate-200 bg-white sm:grid-cols-4">
          <ReviewMetric label="All reviews" value={data.stats.total} />
          <ReviewMetric label="Pending validation" value={data.stats.pending} tone="pending" />
          <ReviewMetric label="Approved" value={data.stats.approved} tone="approved" />
          <ReviewMetric label="Rejected" value={data.stats.rejected} tone="rejected" />
        </section>
      ) : reviewsQuery.isLoading ? (
        <div className="mb-6 grid grid-cols-2 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-4" aria-label="Loading review totals">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[76px] animate-pulse bg-white p-4"><div className="h-3 w-24 bg-slate-100" /><div className="mt-3 h-5 w-10 bg-slate-100" /></div>)}
        </div>
      ) : null}

      <section aria-label="Customer review inbox" className="overflow-hidden border border-slate-200 bg-white shadow-[0_20px_60px_-50px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div><h2 className="text-base font-semibold text-slate-950">Review validation</h2><p className="mt-1 text-xs text-slate-500">Customer identity, rating, message, and moderation status.</p></div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="relative block sm:w-72">
              <span className="sr-only">Search reviews by customer, email, or message</span>
              <Search aria-hidden="true" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Search reviews..." className="min-h-10 w-full border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#4338ca] focus:ring-4 focus:ring-indigo-100" />
            </label>
            <label>
              <span className="sr-only">Filter reviews by validation status</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value as ReviewStatus | ''); setPage(1); }} className="min-h-10 w-full border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#4338ca] focus:ring-4 focus:ring-indigo-100 sm:w-44">
                <option value="">All statuses</option><option value="pending">Pending validation</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-slate-100 px-4 text-xs text-slate-500 sm:px-5">
          <span>{data ? `${data.pagination.total.toLocaleString('en-IN')} ${data.pagination.total === 1 ? 'review' : 'reviews'}` : 'Review activity'}</span>
          <div className="flex items-center gap-3">
            {hasReviewFilter && <button type="button" onClick={clearFilters} className="font-semibold text-[#4338ca] underline underline-offset-2">Clear filters</button>}
            {reviewsQuery.isFetching && <span className="flex items-center gap-1.5"><LoaderCircle aria-hidden="true" size={13} className="animate-spin" />Updating</span>}
          </div>
        </div>

        {reviewsQuery.isLoading ? (
          <ReviewLoading />
        ) : reviewsQuery.isError ? (
          <div role="alert" className="px-5 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center bg-red-50 text-red-700"><AlertCircle aria-hidden="true" size={22} /></span>
            <h2 className="mt-4 text-sm font-semibold text-slate-950">{isAuthError(reviewsQuery.error) ? 'Admin sign-in required' : 'Unable to load reviews'}</h2>
            <p className="mt-2 text-sm text-slate-600">{isAuthError(reviewsQuery.error) ? 'Sign in with an admin account to view review data.' : 'Check your connection and try again.'}</p>
            {isAuthError(reviewsQuery.error) ? (
              <Link to="/login?returnUrl=%2Fadmin%2Freviews" className="mt-4 inline-block text-sm font-semibold text-[#4338ca] underline underline-offset-2">Sign in as an admin</Link>
            ) : (
              <button type="button" onClick={() => void reviewsQuery.refetch()} className="mt-4 text-sm font-semibold text-[#4338ca] underline underline-offset-2">Try again</button>
            )}
          </div>
        ) : data && data.reviews.length > 0 ? (
          <>
            <div className="divide-y divide-slate-200">
              {data.reviews.map((review) => (
                <ReviewRow
                  key={review._id}
                  review={review}
                  busy={statusMutation.isPending && statusMutation.variables?.id === review._id}
                  onStatusChange={(nextStatus) => statusMutation.mutate({ id: review._id, status: nextStatus })}
                />
              ))}
            </div>
            <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">
              <span>Page {data.pagination.page} of {Math.max(data.pagination.pages, 1)}</span>
              <div className="flex gap-2">
                <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="flex h-9 w-9 items-center justify-center border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft aria-hidden="true" size={16} /></button>
                <button type="button" aria-label="Next page" disabled={page >= data.pagination.pages} onClick={() => setPage((current) => current + 1)} className="flex h-9 w-9 items-center justify-center border border-slate-300 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight aria-hidden="true" size={16} /></button>
              </div>
            </footer>
          </>
        ) : (
          <div className="px-5 py-16 text-center" role="status">
            <span className="mx-auto flex h-12 w-12 items-center justify-center bg-indigo-50 text-[#4338ca]"><MessageSquareText aria-hidden="true" size={22} /></span>
            <h2 className="mt-4 text-sm font-semibold text-slate-950">{hasReviewFilter ? 'No matching reviews' : 'No reviews to validate'}</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{hasReviewFilter ? 'Try changing your search or status filter.' : 'Customer reviews submitted from their account will appear here for validation.'}</p>
            {hasReviewFilter && <button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-[#4338ca] underline underline-offset-2">Clear filters</button>}
          </div>
        )}
      </section>
    </div>
  );
};

const ReviewMetric: React.FC<{ label: string; value: number; tone?: 'pending' | 'approved' | 'rejected' }> = ({ label, value, tone }) => (
  <div className="border-b border-r border-slate-200 p-4 last:border-r-0 sm:border-b-0">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className={`mt-2 text-2xl font-semibold tabular-nums ${tone === 'pending' ? 'text-amber-700' : tone === 'approved' ? 'text-emerald-700' : tone === 'rejected' ? 'text-red-700' : 'text-slate-950'}`}>{value.toLocaleString('en-IN')}</p>
  </div>
);

const ReviewLoading: React.FC = () => (
  <div className="space-y-3 p-4 sm:p-5" aria-label="Loading reviews">
    {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse border border-slate-100 bg-slate-50" />)}
  </div>
);

const ReviewRow: React.FC<{
  review: CustomerReview;
  busy: boolean;
  onStatusChange: (status: ReviewStatus) => void;
}> = ({ review, busy, onStatusChange }) => (
  <article className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-6 sm:p-5">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h3 className="text-sm font-semibold text-slate-950">{review.customerName}</h3>
        <a href={`mailto:${review.customerEmail}`} className="break-all text-xs text-[#4338ca] hover:underline">{review.customerEmail}</a>
        <ReviewStatusBadge status={review.status} />
      </div>
      <div className="mt-2 flex items-center gap-1 text-[#d96720]" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden="true" size={14} fill={index < review.rating ? 'currentColor' : 'none'} />)}
        <span className="ml-1 text-xs font-semibold text-slate-700">{review.rating}/5</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.message}</p>
      <p className="mt-3 text-xs text-slate-500">Submitted {dateTime(review.createdAt)}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2 sm:w-36 sm:flex-col sm:items-stretch">
      {review.status !== 'approved' && (
        <button type="button" onClick={() => onStatusChange('approved')} disabled={busy} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 border border-emerald-700 bg-emerald-700 px-3 text-xs font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">
          {busy ? <LoaderCircle aria-hidden="true" size={13} className="animate-spin" /> : <ThumbsUp aria-hidden="true" size={13} />} Approve
        </button>
      )}
      {review.status !== 'rejected' && (
        <button type="button" onClick={() => onStatusChange('rejected')} disabled={busy} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50">
          <ThumbsDown aria-hidden="true" size={13} /> Reject
        </button>
      )}
      {review.status !== 'pending' && (
        <button type="button" onClick={() => onStatusChange('pending')} disabled={busy} className="min-h-8 text-xs font-semibold text-slate-500 underline underline-offset-2 disabled:opacity-50">Return to pending</button>
      )}
    </div>
  </article>
);

export default AdminReviewsPage;
