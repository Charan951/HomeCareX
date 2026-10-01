import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock3, LoaderCircle, MessageSquareText, Send, Star } from 'lucide-react';
import { createReview, fetchMyReviews, type CustomerReview, type ReviewStatus } from '@/services/reviewsApi';

const statusLabels: Record<ReviewStatus, string> = {
  pending: 'Pending validation',
  approved: 'Approved',
  rejected: 'Not approved',
};

const dateLabel = (date: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(date));

export default function Reviews() {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const queryClient = useQueryClient();
  const reviewsQuery = useQuery({ queryKey: ['customer-reviews'], queryFn: fetchMyReviews });
  const reviewMutation = useMutation({
    mutationFn: createReview,
    onSuccess: async () => {
      setMessage('');
      setRating(5);
      setFeedback('Your review was sent for validation.');
      await queryClient.invalidateQueries({ queryKey: ['customer-reviews'] });
    },
    onError: (error: unknown) => {
      const message = typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Unable to send your review. Please try again.';
      setFeedback(message);
    },
  });

  const submitReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');
    if (message.trim().length < 20) {
      setFeedback('Please write at least 20 characters so we can understand your feedback.');
      return;
    }
    reviewMutation.mutate({ rating, message: message.trim() });
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#4338ca]">Your feedback</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Reviews</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Share your experience with HomeCareX. Every review is checked by our team before it is approved.</p>
      </header>

      <section className="border border-slate-200 bg-white p-5 sm:p-7">
        <div className="mb-5 border-b border-slate-200 pb-4">
          <h2 className="text-lg font-semibold text-slate-950">Write a review</h2>
          <p className="mt-1 text-sm text-slate-600">Your name and account email will be included for validation.</p>
        </div>
        <form onSubmit={submitReview} className="space-y-5">
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-slate-700">Your rating</legend>
            <div className="flex gap-1" role="radiogroup" aria-label="Rating from one to five stars">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                    onClick={() => setRating(value)}
                    className="rounded-sm p-1 text-[#e8752b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca]"
                  >
                    <Star aria-hidden="true" size={24} fill={value <= rating ? 'currentColor' : 'none'} />
                  </button>
                );
              })}
            </div>
          </fieldset>
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="customer-review-message" className="text-sm font-medium text-slate-700">Your review</label>
              <span className="text-xs tabular-nums text-slate-500">{message.length}/2000</span>
            </div>
            <textarea
              id="customer-review-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              minLength={20}
              required
              rows={5}
              placeholder="Tell us about your experience..."
              className="min-h-32 w-full resize-y border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#4338ca] focus:ring-4 focus:ring-indigo-100"
            />
            <p className="mt-1 text-xs text-slate-500">Please write at least 20 characters.</p>
          </div>
          {feedback && <p role={reviewMutation.isError ? 'alert' : 'status'} className={`border px-3 py-2.5 text-sm ${reviewMutation.isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{feedback}</p>}
          <button type="submit" disabled={reviewMutation.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#4338ca] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
            {reviewMutation.isPending ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin" /> : <Send aria-hidden="true" size={16} />}
            {reviewMutation.isPending ? 'Sending...' : 'Send for validation'}
          </button>
        </form>
      </section>

      <section aria-labelledby="your-reviews-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><h2 id="your-reviews-heading" className="text-lg font-semibold text-slate-950">Your submitted reviews</h2><p className="mt-1 text-sm text-slate-600">Track review validation here.</p></div>
          {reviewsQuery.data && <span className="text-xs text-slate-500">{reviewsQuery.data.length} {reviewsQuery.data.length === 1 ? 'review' : 'reviews'}</span>}
        </div>
        {reviewsQuery.isLoading ? (
          <div className="border border-slate-200 bg-white p-7 text-center" role="status"><LoaderCircle aria-hidden="true" className="mx-auto animate-spin text-[#4338ca]" /><p className="mt-3 text-sm text-slate-600">Loading your reviews...</p></div>
        ) : reviewsQuery.isError ? (
          <div role="alert" className="border border-red-200 bg-red-50 p-5 text-sm text-red-800">Unable to load your reviews. Refresh the page and try again.</div>
        ) : reviewsQuery.data?.length ? (
          <div className="divide-y divide-slate-200 border border-slate-200 bg-white">
            {reviewsQuery.data.map((review) => <ReviewCard key={review._id} review={review} />)}
          </div>
        ) : (
          <div className="border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
            <MessageSquareText aria-hidden="true" size={22} className="mx-auto text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800">No reviews submitted yet</p>
            <p className="mt-1 text-xs text-slate-500">Reviews you send will appear here with their validation status.</p>
          </div>
        )}
      </section>
    </div>
  );
}

const ReviewCard: React.FC<{ review: CustomerReview }> = ({ review }) => (
  <article className="p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-1 text-[#d96720]" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: review.rating }, (_, index) => <Star key={index} aria-hidden="true" size={14} fill="currentColor" />)}
        <span className="ml-1 text-xs font-semibold text-slate-700">{review.rating}/5</span>
      </span>
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${review.status === 'approved' ? 'text-emerald-700' : review.status === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}>
        {review.status === 'approved' ? <CheckCircle2 aria-hidden="true" size={14} /> : <Clock3 aria-hidden="true" size={14} />}
        {statusLabels[review.status]}
      </span>
    </div>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{review.message}</p>
    <p className="mt-3 text-xs text-slate-500">Submitted {dateLabel(review.createdAt)}</p>
  </article>
);
