
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import http from '@/lib/http';
import './index.css';

type RefundStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'Processing'
  | 'Completed'
  | 'Failed';

type PaymentMethod = 'Razorpay' | 'Wallet';

interface RefundRecord {
  id: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  service: string;
  paymentId: string;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  refundAmount: number;
  reason: string;
  requestedAt: string;
  status: RefundStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  failureMessage?: string;
  razorpayRefundId?: string;
}

interface RefundApiRecord {
  _id?: string;
  id?: string;
  amount?: number | string;
  currency?: string;
  reason?: string;
  status?: string;
  method?: string;
  paymentMethod?: string;
  requestedAt?: string;
  createdAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  processedAt?: string;
  rejectionReason?: string;
  failureMessage?: string;
  errorMessage?: string;
  razorpayRefundId?: string;
  paymentId?: string | Record<string, unknown>;
  bookingId?: string | Record<string, unknown>;
  customerId?: string | Record<string, unknown>;
  requestedBy?: string | Record<string, unknown>;
  approvedBy?: string | Record<string, unknown>;
  rejectedBy?: string | Record<string, unknown>;
}

interface RefundApiResponse {
  success: boolean;
  data: RefundApiRecord[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    pages?: number;
  };
  message?: string;
}

const PAGE_SIZE = 10;

const STATUS_OPTIONS: RefundStatus[] = [
  'Pending',
  'Approved',
  'Rejected',
  'Processing',
  'Completed',
  'Failed',
];

const currency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (value?: string) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?';

const getObject = (
  value?: string | Record<string, unknown>,
): Record<string, unknown> =>
  value && typeof value === 'object' ? value : {};

const getId = (
  value?: string | Record<string, unknown>,
): string => {
  if (typeof value === 'string') return value;

  const object = getObject(value);
  const id = object._id ?? object.id;

  return typeof id === 'string' ? id : '';
};

const getText = (value: unknown, fallback = '—'): string =>
  typeof value === 'string' && value.trim()
    ? value.trim()
    : fallback;

const getAmount = (value: unknown): number => {
  if (typeof value === 'string' && !value.trim()) return 0;

  const amount = Number(value);

  return Number.isFinite(amount) && amount >= 0 ? amount : 0;
};

const mapStatus = (status?: string): RefundStatus => {
  switch (status?.toLowerCase().trim()) {
    case 'requested':
    case 'pending':
      return 'Pending';

    case 'approved':
      return 'Approved';

    case 'processing':
      return 'Processing';

    case 'processed':
    case 'completed':
    case 'success':
    case 'refunded':
      return 'Completed';

    case 'rejected':
      return 'Rejected';

    case 'failed':
      return 'Failed';

    default:
      return 'Pending';
  }
};

const mapRefund = (item: RefundApiRecord): RefundRecord => {
  const payment = getObject(item.paymentId);
  const booking = getObject(item.bookingId);
  const customer = getObject(item.customerId);
  const approvedBy = getObject(item.approvedBy);
  const rejectedBy = getObject(item.rejectedBy);

  const status = mapStatus(item.status);

  const reviewer =
    status === 'Rejected'
      ? rejectedBy.name
      : approvedBy.name;

  const method = getText(
    item.paymentMethod ?? item.method ?? payment.method,
    'Razorpay',
  ).toLowerCase();

  const paymentMethod: PaymentMethod = method.includes('wallet')
    ? 'Wallet'
    : 'Razorpay';

  return {
    id: getText(item._id ?? item.id, ''),
    bookingId: getId(item.bookingId) || '—',
    customerName: getText(customer.name, 'Customer'),
    customerEmail: getText(customer.email, '—'),
    service: getText(
      booking.serviceName ?? booking.service,
      'Service not specified',
    ),
    paymentId: getId(item.paymentId) || '—',
    paymentMethod,
    paidAmount: getAmount(payment.amount),
    refundAmount: getAmount(item.amount),
    reason: getText(item.reason, 'No reason provided'),
    requestedAt: getText(item.requestedAt ?? item.createdAt, ''),
    status,
    reviewedBy:
      typeof reviewer === 'string' && reviewer.trim()
        ? reviewer
        : undefined,
    reviewedAt:
      item.processedAt ?? item.approvedAt ?? item.rejectedAt,
    rejectionReason: item.rejectionReason,
    failureMessage: item.failureMessage ?? item.errorMessage,
    razorpayRefundId: item.razorpayRefundId,
  };
};

const getErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
            error?: string;
            code?: string;
          };
        };
      }
    ).response;

    const data = response?.data;

    if (data?.code === 'REFUND_FAILED') {
      return (
        data.message ??
        'The payment gateway could not process this refund. ' +
          'Verify its actual status before retrying.'
      );
    }

    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }

  if (error instanceof Error) return error.message;

  return 'Something went wrong. Please try again.';
};

const decodeURIComponentSafe = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const StatusBadge: React.FC<{ status: RefundStatus }> = ({
  status,
}) => (
  <span
    className={`refund-status refund-status--${status.toLowerCase()}`}
    aria-label={`Refund status: ${status}`}
  >
    <span className="refund-status__dot" aria-hidden="true" />
    {status}
  </span>
);

const StatCard: React.FC<{
  label: string;
  value: number;
  hint: string;
  variant?: 'pending' | 'completed' | 'failed';
}> = ({ label, value, hint, variant }) => (
  <article
    className={`refunds-stat-card ${
      variant ? `refunds-stat-card--${variant}` : ''
    }`}
  >
    <div className="refunds-stat-card__top">
      <span className="refunds-stat-card__label">{label}</span>
      <span className="refunds-stat-card__icon" aria-hidden="true">
        {variant === 'pending'
          ? '◷'
          : variant === 'completed'
            ? '✓'
            : variant === 'failed'
              ? '!'
              : '↗'}
      </span>
    </div>
    <div className="refunds-stat-card__value">{value}</div>
    <div className="refunds-stat-card__hint">{hint}</div>
  </article>
);

const DetailRow: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
}> = ({ label, value, mono = false }) => (
  <div className="refunds-detail-row">
    <span>{label}</span>
    <strong className={mono ? 'refunds-mono' : undefined}>
      {value}
    </strong>
  </div>
);

const PageHeading: React.FC<{
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <header className="refunds-page__header">
    <div className="refunds-page__heading-copy">
      <h1 className="refunds-page__title">{title}</h1>
      <p className="refunds-page__subtitle">{subtitle}</p>
    </div>
    {action && (
      <div className="refunds-page__header-actions">{action}</div>
    )}
  </header>
);

const PanelHeading: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="refunds-panel__heading">
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    {action}
  </div>
);

const AdminRefundsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [refunds, setRefunds] = useState<RefundRecord[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadRefunds = useCallback(async () => {
    setLoading(true);
    setLoadError('');

    try {
      const response = await http.get<RefundApiResponse>(
        '/admin/refunds',
        {
          params: { page: 1, limit: 100 },
        },
      );

      if (response.data?.success === false) {
        throw new Error(
          response.data.message ?? 'Unable to load refund requests.',
        );
      }

      const records = response.data?.data;

      if (!Array.isArray(records)) {
        throw new Error('The server returned an invalid refund list.');
      }

      setRefunds(records.map(mapRefund));
    } catch (error: unknown) {
      setLoadError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRefunds();
  }, [loadRefunds]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, methodFilter]);

  useEffect(() => {
    setReviewError('');
    setSuccessMessage('');
    setRejectionReason('');
  }, [id]);

  const decodedId = id ? decodeURIComponentSafe(id) : undefined;

  const selectedRefund = decodedId
    ? refunds.find((refund) => refund.id === decodedId)
    : undefined;

  const stats = useMemo(() => {
    const pendingRefunds = refunds.filter(
      (refund) => refund.status === 'Pending',
    );

    return {
      total: refunds.length,
      pending: pendingRefunds.length,
      pendingAmount: pendingRefunds.reduce(
        (total, refund) => total + refund.refundAmount,
        0,
      ),
      completed: refunds.filter(
        (refund) => refund.status === 'Completed',
      ).length,
      failed: refunds.filter(
        (refund) => refund.status === 'Failed',
      ).length,
    };
  }, [refunds]);

  const filteredRefunds = useMemo(() => {
    const query = search.trim().toLowerCase();

    return refunds.filter((refund) => {
      const values = [
        refund.id,
        refund.bookingId,
        refund.customerName,
        refund.customerEmail,
        refund.paymentId,
        refund.service,
      ];

      const matchesSearch =
        !query ||
        values.some((value) => value.toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === 'All' || refund.status === statusFilter;

      const matchesMethod =
        methodFilter === 'All' || refund.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    });
  }, [refunds, search, statusFilter, methodFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRefunds.length / PAGE_SIZE),
  );

  const currentPage = Math.min(page, totalPages);

  const visibleRefunds = filteredRefunds.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const openDetails = (refund: RefundRecord) => {
    setReviewError('');
    setSuccessMessage('');
    setRejectionReason('');
    navigate(`/admin/refunds/${encodeURIComponent(refund.id)}`);
  };

  const backToList = () => {
    setReviewError('');
    setSuccessMessage('');
    setRejectionReason('');
    navigate('/admin/refunds');
  };

  const updateRefund = async (action: 'approve' | 'reject') => {
    if (!selectedRefund || actionLoading) return;

    if (selectedRefund.status !== 'Pending') {
      setReviewError('Only pending refund requests can be reviewed.');
      return;
    }

    const reason = rejectionReason.trim();

    if (action === 'reject' && !reason) {
      setReviewError('Please enter a reason for rejecting this request.');
      return;
    }

    if (
      action === 'approve' &&
      (selectedRefund.refundAmount <= 0 ||
        selectedRefund.refundAmount > selectedRefund.paidAmount)
    ) {
      setReviewError(
        'The refund amount must be greater than zero and cannot exceed the amount paid. Verify the payment amount returned by the API.',
      );
      return;
    }

    const confirmation =
      action === 'approve'
        ? `Approve and send ${currency(
            selectedRefund.refundAmount,
          )} through ${selectedRefund.paymentMethod}? This may initiate a real refund.`
        : 'Reject this refund request?';

    if (!window.confirm(confirmation)) return;

    setActionLoading(true);
    setReviewError('');
    setSuccessMessage('');

    try {
      await http.patch(
        `/admin/refunds/${encodeURIComponent(selectedRefund.id)}`,
        {
          action,
          ...(action === 'reject' ? { rejectionReason: reason } : {}),
        },
      );

      setSuccessMessage(
        action === 'approve'
          ? 'The refund action was accepted by the server. Verify the updated status below.'
          : 'Refund request rejected successfully.',
      );

      setRejectionReason('');
      await loadRefunds();
    } catch (error: unknown) {
      setReviewError(getErrorMessage(error));
      await loadRefunds();
    } finally {
      setActionLoading(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatusFilter('All');
    setMethodFilter('All');
    setPage(1);
  };

  if (loading && refunds.length === 0) {
    return (
      <main className="refunds-page" aria-busy="true">
        <PageHeading
          title="Refunds"
          subtitle="Review refund requests and monitor their status."
        />
        <section
          className="refunds-panel refunds-loading"
          role="status"
        >
          <span className="refunds-loading__spinner" />
          Loading refund requests…
        </section>
      </main>
    );
  }

  if (id && loading && !selectedRefund) {
    return (
      <main
        className="refunds-page refunds-page--detail"
        aria-busy="true"
      >
        <button
          type="button"
          className="refunds-back-link"
          onClick={backToList}
        >
          ← Back to Refunds
        </button>
        <section
          className="refunds-panel refunds-loading"
          role="status"
        >
          <span className="refunds-loading__spinner" />
          Loading refund details…
        </section>
      </main>
    );
  }

  if (id && loadError && !selectedRefund) {
    return (
      <main className="refunds-page refunds-page--detail">
        <button
          type="button"
          className="refunds-back-link"
          onClick={backToList}
        >
          ← Back to Refunds
        </button>
        <section className="refunds-panel refunds-not-found">
          <h1>Unable to load refunds</h1>
          <p>{loadError}</p>
          <button
            className="refunds-button refunds-button--primary"
            type="button"
            onClick={() => void loadRefunds()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (id && !selectedRefund) {
    return (
      <main className="refunds-page refunds-page--detail">
        <button
          type="button"
          className="refunds-back-link"
          onClick={backToList}
        >
          ← Back to Refunds
        </button>
        <section className="refunds-panel refunds-not-found">
          <div className="refunds-empty-icon" aria-hidden="true">
            !
          </div>
          <h1>Refund request not found</h1>
          <p>
            This request was not found in the loaded records. Return to
            the list or try loading the records again.
          </p>
          <button
            className="refunds-button refunds-button--primary"
            type="button"
            onClick={() => void loadRefunds()}
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  if (selectedRefund) {
    return (
      <main className="refunds-page refunds-page--detail">
        <button
          type="button"
          className="refunds-back-link"
          onClick={backToList}
        >
          <span aria-hidden="true">←</span> Back to Refunds
        </button>

        <PageHeading
          title="Refund details"
          subtitle="Review the original payment, request reason, and decision."
          action={<StatusBadge status={selectedRefund.status} />}
        />

        {reviewError && (
          <div
            className="refunds-alert refunds-alert--error"
            role="alert"
          >
            {reviewError}
          </div>
        )}

        {successMessage && (
          <div
            className="refunds-alert refunds-alert--success"
            role="status"
          >
            {successMessage}
          </div>
        )}

        {loadError && (
          <div
            className="refunds-alert refunds-alert--error"
            role="alert"
          >
            Latest refresh failed: {loadError}
          </div>
        )}

        <section className="refunds-detail-summary">
          <article className="refunds-detail-amount-card refunds-detail-amount-card--highlight">
            <span>Requested refund</span>
            <strong>{currency(selectedRefund.refundAmount)}</strong>
            <small>
              {selectedRefund.refundAmount === selectedRefund.paidAmount
                ? 'Full refund'
                : 'Partial refund'}
            </small>
          </article>

          <article className="refunds-detail-amount-card">
            <span>Original payment</span>
            <strong>{currency(selectedRefund.paidAmount)}</strong>
            <small>{selectedRefund.paymentMethod}</small>
          </article>

          <article className="refunds-detail-amount-card">
            <span>Booking reference</span>
            <strong className="refunds-reference">
              {selectedRefund.bookingId}
            </strong>
            <small>{selectedRefund.service}</small>
          </article>
        </section>

        <div className="refunds-detail-grid">
          <section className="refunds-panel refunds-detail-panel">
            <PanelHeading
              title="Customer details"
              description="Customer associated with this refund."
            />
            <div className="refunds-detail-body">
              <div className="refunds-detail-customer">
                <span className="refunds-avatar refunds-avatar--large">
                  {getInitials(selectedRefund.customerName)}
                </span>
                <div>
                  <strong>{selectedRefund.customerName}</strong>
                  <p>{selectedRefund.customerEmail}</p>
                </div>
              </div>
              <DetailRow
                label="Service"
                value={selectedRefund.service}
              />
              <DetailRow
                label="Booking ID"
                value={selectedRefund.bookingId}
              />
              <DetailRow
                label="Requested on"
                value={formatDate(selectedRefund.requestedAt)}
              />
            </div>
          </section>

          <section className="refunds-panel refunds-detail-panel">
            <PanelHeading
              title="Payment details"
              description="Original transaction information."
            />
            <div className="refunds-detail-body">
              <DetailRow
                label="Refund ID"
                value={selectedRefund.id}
                mono
              />
              <DetailRow
                label="Payment ID"
                value={selectedRefund.paymentId}
                mono
              />
              <DetailRow
                label="Payment method"
                value={selectedRefund.paymentMethod}
              />
              <DetailRow
                label="Amount paid"
                value={currency(selectedRefund.paidAmount)}
              />
              <DetailRow
                label="Refund requested"
                value={currency(selectedRefund.refundAmount)}
              />
              {selectedRefund.razorpayRefundId && (
                <DetailRow
                  label="Gateway refund ID"
                  value={selectedRefund.razorpayRefundId}
                  mono
                />
              )}
            </div>
          </section>

          <section className="refunds-panel refunds-detail-panel">
            <PanelHeading
              title="Request reason"
              description="Reason submitted by the requester."
            />
            <div className="refunds-detail-body">
              <p className="refunds-reason">{selectedRefund.reason}</p>

              {selectedRefund.rejectionReason && (
                <div className="refunds-review-note">
                  <strong>Rejection reason</strong>
                  <p>{selectedRefund.rejectionReason}</p>
                </div>
              )}

              {selectedRefund.failureMessage && (
                <div className="refunds-review-note refunds-review-note--error">
                  <strong>Refund failure</strong>
                  <p>{selectedRefund.failureMessage}</p>
                </div>
              )}
            </div>
          </section>

          <section className="refunds-panel refunds-detail-panel">
            <PanelHeading
              title="Review decision"
              description="Review information and available actions."
            />
            <div className="refunds-detail-body">
              <DetailRow
                label="Current status"
                value={selectedRefund.status}
              />
              <DetailRow
                label="Reviewed by"
                value={selectedRefund.reviewedBy ?? 'Not reviewed'}
              />
              <DetailRow
                label="Reviewed on"
                value={formatDate(selectedRefund.reviewedAt)}
              />

              {selectedRefund.status === 'Pending' && (
                <div className="refunds-review-form">
                  <label htmlFor="refund-rejection-reason">
                    Rejection reason
                  </label>
                  <textarea
                    id="refund-rejection-reason"
                    rows={3}
                    maxLength={500}
                    placeholder="Enter a reason if rejecting this request..."
                    value={rejectionReason}
                    onChange={(event) =>
                      setRejectionReason(event.target.value)
                    }
                    disabled={actionLoading}
                  />
                  <small>
                    {rejectionReason.length}/500 characters
                  </small>

                  <div className="refunds-detail-actions">
                    <button
                      type="button"
                      className="refunds-button refunds-button--danger"
                      onClick={() => void updateRefund('reject')}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing…' : 'Reject request'}
                    </button>
                    <button
                      type="button"
                      className="refunds-button refunds-button--primary"
                      onClick={() => void updateRefund('approve')}
                      disabled={actionLoading}
                    >
                      {actionLoading
                        ? 'Processing…'
                        : 'Approve and refund'}
                    </button>
                  </div>

                  <p className="refunds-action-warning">
                    Approval may initiate a real payment gateway refund.
                    Verify the payment and request before proceeding.
                  </p>
                </div>
              )}

              {selectedRefund.status === 'Completed' && (
                <div className="refunds-alert refunds-alert--success">
                  This refund is marked as completed by the server.
                </div>
              )}

              {selectedRefund.status === 'Failed' && (
                <div className="refunds-alert refunds-alert--error">
                  This refund is marked as failed. Verify the gateway
                  status before attempting any further action.
                </div>
              )}

              <div className="refunds-detail-actions">
                <button
                  type="button"
                  className="refunds-button refunds-button--secondary"
                  onClick={backToList}
                >
                  Back to list
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="refunds-page">
      <PageHeading
        title="Refunds"
        subtitle="Review refund requests, monitor decisions, and track payment status."
      />

      {loadError && (
        <div
          className="refunds-alert refunds-alert--error"
          role="alert"
        >
          <span>{loadError}</span>
          <button
            className="refunds-button refunds-button--secondary"
            type="button"
            onClick={() => void loadRefunds()}
          >
            Try again
          </button>
        </div>
      )}

      <section className="refunds-stats" aria-label="Refund summary">
        <StatCard
          label="Total requests"
          value={stats.total}
          hint="Loaded refund records"
        />
        <StatCard
          label="Awaiting review"
          value={stats.pending}
          hint={`${currency(stats.pendingAmount)} requested`}
          variant="pending"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          hint="Marked as processed"
          variant="completed"
        />
        <StatCard
          label="Failed"
          value={stats.failed}
          hint="Requires investigation"
          variant="failed"
        />
      </section>

      <section className="refunds-panel">
        <PanelHeading
          title="Refund requests"
          description="Search, filter, and open a request to review its details."
          action={
            <span className="refunds-result-count">
              {filteredRefunds.length} result
              {filteredRefunds.length === 1 ? '' : 's'}
            </span>
          }
        />

        <div className="refunds-filters">
          <label className="refunds-search">
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search by refund, booking, customer..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search refund requests"
            />
          </label>

          <label className="refunds-filter">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="refunds-filter">
            <span>Payment</span>
            <select
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
              aria-label="Filter by payment method"
            >
              <option value="All">All methods</option>
              <option value="Razorpay">Razorpay</option>
              <option value="Wallet">Wallet</option>
            </select>
          </label>

          <button
            type="button"
            className="refunds-button refunds-button--text"
            onClick={resetFilters}
          >
            Clear filters
          </button>
        </div>

        {loading && refunds.length > 0 && (
          <div className="refunds-inline-loading" role="status">
            Updating refund records…
          </div>
        )}

        <div className="refunds-table-wrap">
          <table className="refunds-table">
            <thead>
              <tr>
                <th scope="col">Refund request</th>
                <th scope="col">Customer</th>
                <th scope="col">Payment</th>
                <th scope="col">Refund amount</th>
                <th scope="col">Requested on</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleRefunds.map((refund) => (
                <tr key={refund.id}>
                  <td>
                    <Link
                      className="refunds-id"
                      to={`/admin/refunds/${encodeURIComponent(refund.id)}`}
                    >
                      {refund.id || 'Unknown ID'}
                    </Link>
                    <span className="refunds-secondary-text">
                      Booking {refund.bookingId}
                    </span>
                  </td>
                  <td>
                    <div className="refunds-customer">
                      <span className="refunds-avatar">
                        {getInitials(refund.customerName)}
                      </span>
                      <span className="refunds-customer__info">
                        <strong>{refund.customerName}</strong>
                        <span className="refunds-secondary-text">
                          {refund.customerEmail}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <strong>{refund.paymentMethod}</strong>
                    <span className="refunds-secondary-text">
                      Paid {currency(refund.paidAmount)}
                    </span>
                  </td>
                  <td>
                    <strong className="refunds-amount">
                      {currency(refund.refundAmount)}
                    </strong>
                    <span className="refunds-secondary-text">
                      {refund.refundAmount === refund.paidAmount
                        ? 'Full refund'
                        : 'Partial refund'}
                    </span>
                  </td>
                  <td className="refunds-date">
                    {formatDate(refund.requestedAt)}
                  </td>
                  <td>
                    <StatusBadge status={refund.status} />
                  </td>
                  <td>
                    <button
                      className="refunds-review-button"
                      type="button"
                      onClick={() => openDetails(refund)}
                    >
                      View details <span aria-hidden="true">→</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && visibleRefunds.length === 0 && (
          <div className="refunds-empty">
            <div className="refunds-empty-icon" aria-hidden="true">
              ⌕
            </div>
            <h3>
              {loadError
                ? 'Refund data unavailable'
                : 'No refund requests found'}
            </h3>
            <p>
              {loadError
                ? 'Check your connection and try loading the records again.'
                : 'Try changing your search or filters.'}
            </p>
            <button
              type="button"
              className="refunds-button refunds-button--secondary"
              onClick={
                loadError ? () => void loadRefunds() : resetFilters
              }
            >
              {loadError ? 'Try again' : 'Clear filters'}
            </button>
          </div>
        )}

        {filteredRefunds.length > 0 && (
          <div className="refunds-pagination">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(
                currentPage * PAGE_SIZE,
                filteredRefunds.length,
              )}{' '}
              of {filteredRefunds.length}
            </span>
            <div className="refunds-pagination__actions">
              <button
                type="button"
                className="refunds-button refunds-button--secondary"
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                disabled={currentPage <= 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                className="refunds-button refunds-button--secondary"
                onClick={() =>
                  setPage((current) =>
                    Math.min(totalPages, current + 1),
                  )
                }
                disabled={currentPage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminRefundsPage;
export { AdminRefundsPage };