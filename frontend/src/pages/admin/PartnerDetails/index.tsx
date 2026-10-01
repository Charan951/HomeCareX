import React, {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import { usePermissions } from "@/hooks/usePermissions";

import DocumentViewer from "../../../components/DocumentViewer";
import KycChecklist from "../../../components/KycChecklist";

import {
  PartnerDetails as PartnerDetailsType,
} from "../../../mocks/partnerDetails";

import {
  getPartnerById,
  notifyPartner,
  recordPartnerAudit,
  updatePartnerKyc,
  updatePartnerStatus,
} from "../../../services/partnerApi";

import "./index.css";

type Tab =
  | "profile"
  | "kyc"
  | "categories"
  | "performance"
  | "bookings"
  | "earnings"
  | "payouts"
  | "reviews"
  | "support"
  | "activity";

const tabs: {
  id: Tab;
  label: string;
}[] = [
  {
    id: "profile",
    label: "Profile",
  },
  {
    id: "kyc",
    label: "KYC",
  },
  {
    id: "categories",
    label: "Categories",
  },
  {
    id: "performance",
    label: "Performance",
  },
  {
    id: "bookings",
    label: "Bookings",
  },
  {
    id: "earnings",
    label: "Earnings",
  },
  {
    id: "payouts",
    label: "Payouts",
  },
  {
    id: "reviews",
    label: "Reviews",
  },
  {
    id: "support",
    label: "Support",
  },
  {
    id: "activity",
    label: "Activity",
  },
];

const AdminPartnerDetailsPage: React.FC =
  () => {
    const { can } = usePermissions();

    const hasKycApprovalPermission =
      can("kyc:approve");

    const { id } = useParams<{
      id: string;
    }>();

    const [partner, setPartner] =
      useState<PartnerDetailsType | null>(
        null
      );

    const [loading, setLoading] =
      useState(true);

    const [error, setError] =
      useState("");

    const [activeTab, setActiveTab] =
      useState<Tab>("profile");

    const [actionLoading, setActionLoading] =
      useState(false);

    const [actionError, setActionError] =
      useState("");

    const [rejectOpen, setRejectOpen] =
      useState(false);

    const [rejectReason, setRejectReason] =
      useState("");

    useEffect(() => {
      let mounted = true;

      const loadPartner = async () => {
        if (!id) {
          setError(
            "Partner ID is missing."
          );
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          setError("");

          const result =
            await getPartnerById(id);

          if (!mounted) {
            return;
          }

          if (!result) {
            setError(
              "Partner not found."
            );
            setPartner(null);
            return;
          }

          setPartner(result);
        } catch {
          if (mounted) {
            setError(
              "Unable to load partner details."
            );
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      void loadPartner();

      return () => {
        mounted = false;
      };
    }, [id]);

    const refreshPartner = async () => {
      if (!id) {
        return;
      }

      const result =
        await getPartnerById(id);

      if (result) {
        setPartner(result);
      }
    };

    const approveKyc = async () => {
      if (!partner) {
        return;
      }

      if (!hasKycApprovalPermission) {
        setActionError(
          "You do not have permission to approve KYC."
        );
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        await updatePartnerKyc(
          partner.id,
          {
            decision: "approve",
          }
        );

        await notifyPartner(
          partner.id,
          "Your KYC has been approved."
        );

        await recordPartnerAudit(
          partner.id,
          "KYC_APPROVED",
          {
            previousStatus:
              partner.kycStatus,
            newStatus: "Approved",
          }
        );

        await refreshPartner();
      } catch (requestError) {
        setActionError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to approve KYC."
        );
      } finally {
        setActionLoading(false);
      }
    };

    const rejectKyc = async () => {
      if (!partner) {
        return;
      }

      if (!hasKycApprovalPermission) {
        setActionError(
          "You do not have permission to reject KYC."
        );
        return;
      }

      const reason =
        rejectReason.trim();

      if (!reason) {
        setActionError(
          "Rejection reason is required."
        );
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        await updatePartnerKyc(
          partner.id,
          {
            decision: "reject",
            reason,
          }
        );

        await notifyPartner(
          partner.id,
          `Your KYC was rejected. Reason: ${reason}`
        );

        await recordPartnerAudit(
          partner.id,
          "KYC_REJECTED",
          {
            previousStatus:
              partner.kycStatus,
            newStatus: "Rejected",
            reason,
          }
        );

        setRejectOpen(false);
        setRejectReason("");

        await refreshPartner();
      } catch (requestError) {
        setActionError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to reject KYC."
        );
      } finally {
        setActionLoading(false);
      }
    };

    const suspendPartner = async () => {
      if (!partner) {
        return;
      }

      const confirmed =
        window.confirm(
          `Suspend ${partner.name}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setActionLoading(true);
        setActionError("");

        await updatePartnerStatus(
          partner.id,
          {
            status: "Suspended",
          }
        );

        await notifyPartner(
          partner.id,
          "Your partner account has been suspended."
        );

        await recordPartnerAudit(
          partner.id,
          "PARTNER_SUSPENDED",
          {
            previousStatus:
              partner.accountStatus,
            newStatus: "Suspended",
          }
        );

        await refreshPartner();
      } catch (requestError) {
        setActionError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to suspend partner."
        );
      } finally {
        setActionLoading(false);
      }
    };

    if (loading) {
      return (
        <div
          className="partner-details-page"
          role="status"
          aria-live="polite"
        >
          <div className="partner-details-state">
            Loading partner details...
          </div>
        </div>
      );
    }

    if (error || !partner) {
      return (
        <div className="partner-details-page">
          <div
            className="partner-details-state partner-details-error"
            role="alert"
          >
            <h2>
              Unable to load partner
            </h2>

            <p>
              {error ||
                "Partner details are unavailable."}
            </p>

            <Link
              to="/admin/partners"
              className="partner-details-back"
            >
              Back to Partners
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="partner-details-page">
        <div className="partner-details-header">
          <div>
            <Link
              to="/admin/partners"
              className="partner-details-back"
            >
              ← Back to Partners
            </Link>

            <h1>
              {partner.name}
            </h1>

            <p>
              Partner ID: {partner.id}
            </p>
          </div>

          <div className="partner-details-actions">
            <span
              className={`partner-status ${partner.kycStatus.toLowerCase()}`}
            >
              KYC: {partner.kycStatus}
            </span>

            <span
              className={`partner-status ${partner.accountStatus.toLowerCase()}`}
            >
              Account: {partner.accountStatus}
            </span>
          </div>
        </div>

        <div className="partner-details-summary">
          <div>
            <strong>Email</strong>
            <span>
              {partner.email}
            </span>
          </div>

          <div>
            <strong>Phone</strong>
            <span>
              {partner.phone}
            </span>
          </div>

          <div>
            <strong>Category</strong>
            <span>
              {partner.category}
            </span>
          </div>

          <div>
            <strong>City</strong>
            <span>
              {partner.city}
            </span>
          </div>

          <div>
            <strong>Rating</strong>
            <span>
              ★ {partner.rating.toFixed(1)}
            </span>
          </div>

          <div>
            <strong>Joined</strong>
            <span>
              {partner.joined}
            </span>
          </div>
        </div>

        {actionError && (
          <div
            className="partner-action-error"
            role="alert"
          >
            {actionError}
          </div>
        )}

        <div
          className="partner-tabs"
          role="tablist"
          aria-label="Partner details"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={
                activeTab === tab.id
              }
              className={
                activeTab === tab.id
                  ? "partner-tab active"
                  : "partner-tab"
              }
              onClick={() =>
                setActiveTab(tab.id)
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        <main className="partner-details-content">
          {activeTab === "profile" && (
            <ProfileTab
              partner={partner}
            />
          )}

          {activeTab === "kyc" && (
            <KycTab
              partner={partner}
              actionLoading={
                actionLoading
              }
              rejectOpen={rejectOpen}
              rejectReason={rejectReason}
              setRejectOpen={
                setRejectOpen
              }
              setRejectReason={
                setRejectReason
              }
              onApprove={approveKyc}
              onReject={rejectKyc}
              onSuspend={
                suspendPartner
              }
              hasPermission={
                hasKycApprovalPermission
              }
            />
          )}

          {activeTab === "categories" && (
            <CategoriesTab
              partner={partner}
            />
          )}

          {activeTab === "performance" && (
            <PerformanceTab
              partner={partner}
            />
          )}

          {activeTab === "bookings" && (
            <BookingsTab
              partner={partner}
            />
          )}

          {activeTab === "earnings" && (
            <EarningsTab
              partner={partner}
            />
          )}

          {activeTab === "payouts" && (
            <PayoutsTab
              partner={partner}
            />
          )}

          {activeTab === "reviews" && (
            <ReviewsTab
              partner={partner}
            />
          )}

          {activeTab === "support" && (
            <SupportTab
              partner={partner}
            />
          )}

          {activeTab === "activity" && (
            <ActivityTab
              partner={partner}
            />
          )}
        </main>
      </div>
    );
  };

interface ProfileTabProps {
  partner: PartnerDetailsType;
}

const ProfileTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Profile</h2>

    <div className="detail-grid">
      <div>
        <strong>Name</strong>
        <span>{partner.name}</span>
      </div>

      <div>
        <strong>Email</strong>
        <span>{partner.email}</span>
      </div>

      <div>
        <strong>Phone</strong>
        <span>{partner.phone}</span>
      </div>

      <div>
        <strong>Address</strong>
        <span>{partner.address}</span>
      </div>

      <div>
        <strong>Experience</strong>
        <span>
          {partner.profile.experience} years
        </span>
      </div>
    </div>

    <div className="detail-description">
      <strong>Bio</strong>
      <p>
        {partner.profile.bio}
      </p>
    </div>
  </section>
);

interface KycTabProps {
  partner: PartnerDetailsType;
  actionLoading: boolean;
  rejectOpen: boolean;
  rejectReason: string;
  setRejectOpen: (
    value: boolean
  ) => void;
  setRejectReason: (
    value: string
  ) => void;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onSuspend: () => Promise<void>;
  hasPermission: boolean;
}

const KycTab: React.FC<KycTabProps> = ({
  partner,
  actionLoading,
  rejectOpen,
  rejectReason,
  setRejectOpen,
  setRejectReason,
  onApprove,
  onReject,
  onSuspend,
  hasPermission,
}) => (
  <div className="partner-kyc-layout">
    <section className="detail-card">
      <div className="detail-card-header">
        <div>
          <h2>KYC Review</h2>

          <p>
            Submitted:{" "}
            {partner.kyc.submittedAt}
          </p>
        </div>

        <span
          className={`partner-status ${partner.kycStatus.toLowerCase()}`}
        >
          {partner.kycStatus}
        </span>
      </div>

      <KycChecklist
        items={partner.kyc.checklist}
      />

      <div className="kyc-actions">
        <button
          type="button"
          className="partner-primary-btn"
          disabled={
            actionLoading ||
            !hasPermission ||
            partner.kycStatus === "Approved"
          }
          onClick={() => {
            void onApprove();
          }}
        >
          {actionLoading
            ? "Processing..."
            : "Approve KYC"}
        </button>

        <button
          type="button"
          className="partner-danger-btn"
          disabled={
            actionLoading ||
            !hasPermission
          }
          onClick={() =>
            setRejectOpen(true)
          }
        >
          Reject KYC
        </button>

        <button
          type="button"
          className="partner-secondary-btn"
          disabled={actionLoading}
          onClick={() => {
            void onSuspend();
          }}
        >
          Suspend Partner
        </button>
      </div>

      {!hasPermission && (
        <p className="permission-warning">
          You do not have the{" "}
          <code>kyc:approve</code>{" "}
          permission.
        </p>
      )}

      {rejectOpen && (
        <div className="reject-panel">
          <label htmlFor="reject-reason">
            Rejection reason
          </label>

          <textarea
            id="reject-reason"
            value={rejectReason}
            onChange={(event) =>
              setRejectReason(
                event.target.value
              )
            }
            placeholder="Enter the reason for rejecting this KYC"
            rows={4}
            autoFocus
          />

          <div className="reject-panel-actions">
            <button
              type="button"
              className="partner-secondary-btn"
              disabled={actionLoading}
              onClick={() => {
                setRejectOpen(false);
                setRejectReason("");
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              className="partner-danger-btn"
              disabled={
                actionLoading ||
                !rejectReason.trim()
              }
              onClick={() => {
                void onReject();
              }}
            >
              Confirm Reject
            </button>
          </div>
        </div>
      )}
    </section>

    <section className="detail-card">
      <h2>KYC Documents</h2>

      <div className="kyc-documents">
        {partner.kyc.documents.map(
          (document) => (
            <div
              key={document.id}
              className="kyc-document-card"
            >
              <div className="kyc-document-header">
                <strong>
                  {document.name}
                </strong>

                <span
                  className={`document-status ${document.status.toLowerCase()}`}
                >
                  {document.status}
                </span>
              </div>

              <DocumentViewer
                url={document.url}
                name={document.name}
                mimeType={
                  document.type === "pdf"
                    ? "application/pdf"
                    : "image/png"
                }
                height={360}
              />
            </div>
          )
        )}
      </div>
    </section>
  </div>
);

const CategoriesTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Categories</h2>

    <div className="category-list">
      {partner.categories.map(
        (category) => (
          <span
            key={category}
            className="category-chip"
          >
            {category}
          </span>
        )
      )}
    </div>
  </section>
);

const PerformanceTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Performance</h2>

    <div className="metric-grid">
      <Metric
        label="Completed bookings"
        value={
          partner.performance
            .completedBookings
        }
      />

      <Metric
        label="Cancelled bookings"
        value={
          partner.performance
            .cancelledBookings
        }
      />

      <Metric
        label="Average response"
        value={
          partner.performance
            .averageResponseTime
        }
      />

      <Metric
        label="Customer satisfaction"
        value={`${partner.performance.customerSatisfaction}%`}
      />
    </div>
  </section>
);

const BookingsTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Bookings</h2>

    <div className="responsive-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {partner.bookings.map(
            (booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>
                  {booking.customer}
                </td>
                <td>
                  {booking.service}
                </td>
                <td>
                  {booking.date}
                </td>
                <td>
                  {booking.status}
                </td>
                <td>
                  ₹
                  {booking.amount.toLocaleString(
                    "en-IN"
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const EarningsTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Earnings</h2>

    <div className="responsive-table">
      <table>
        <thead>
          <tr>
            <th>Month</th>
            <th>Bookings</th>
            <th>Earnings</th>
          </tr>
        </thead>

        <tbody>
          {partner.earnings.map(
            (earning) => (
              <tr key={earning.month}>
                <td>{earning.month}</td>
                <td>
                  {earning.bookings}
                </td>
                <td>
                  ₹
                  {earning.earnings.toLocaleString(
                    "en-IN"
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const PayoutsTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Payouts</h2>

    <div className="responsive-table">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {partner.payouts.map(
            (payout) => (
              <tr key={payout.id}>
                <td>{payout.id}</td>
                <td>{payout.date}</td>
                <td>
                  ₹
                  {payout.amount.toLocaleString(
                    "en-IN"
                  )}
                </td>
                <td>{payout.status}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const ReviewsTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Reviews</h2>

    <div className="reviews-list">
      {partner.reviews.map(
        (review) => (
          <article
            key={review.id}
            className="review-card"
          >
            <div>
              <strong>
                {review.customer}
              </strong>

              <span>
                ★ {review.rating}/5
              </span>
            </div>

            <p>{review.comment}</p>

            <small>
              {review.date}
            </small>
          </article>
        )
      )}
    </div>
  </section>
);

const SupportTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Support</h2>

    <div className="responsive-table">
      <table>
        <thead>
          <tr>
            <th>Ticket</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Created</th>
          </tr>
        </thead>

        <tbody>
          {partner.support.map(
            (ticket) => (
              <tr key={ticket.ticketId}>
                <td>
                  {ticket.ticketId}
                </td>
                <td>
                  {ticket.subject}
                </td>
                <td>
                  {ticket.status}
                </td>
                <td>
                  {ticket.createdAt}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  </section>
);

const ActivityTab: React.FC<
  ProfileTabProps
> = ({ partner }) => (
  <section className="detail-card">
    <h2>Activity</h2>

    <div className="activity-list">
      {partner.activity.map(
        (activity) => (
          <article
            key={activity.id}
            className="activity-item"
          >
            <div className="activity-dot" />

            <div>
              <strong>
                {activity.action}
              </strong>

              <p>
                {activity.description}
              </p>

              <small>
                {activity.timestamp}
              </small>
            </div>
          </article>
        )
      )}
    </div>
  </section>
);

interface MetricProps {
  label: string;
  value: React.ReactNode;
}

const Metric: React.FC<MetricProps> =
  ({ label, value }) => (
    <div className="partner-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );

export default AdminPartnerDetailsPage;