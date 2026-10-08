import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom';
import './index.css';
import http, { type ApiResponse } from '../../../lib/http';

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  placement:
    | 'HOME'
    | 'HOME_TOP'
    | 'HOME_MIDDLE'
    | 'HOME_BOTTOM';
  startAt: string;
  endAt: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface BannerForm {
  title: string;
  image: string;
  link: string;
  placement:
    | 'HOME'
    | 'HOME_TOP'
    | 'HOME_MIDDLE'
    | 'HOME_BOTTOM';
  startAt: string;
  endAt: string;
  order: number;
  active: boolean;
}

type BannerStatus =
  | 'active'
  | 'scheduled'
  | 'inactive'
  | 'expired';

const initialForm: BannerForm = {
  title: '',
  image: '',
  link: '',
  placement: 'HOME',
  startAt: '',
  endAt: '',
  order: 0,
  active: true,
};

/* =========================================================
   Date Helpers
   ========================================================= */

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDateTimeLocal = (
  value: string,
): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0');

  const day = String(
    date.getDate(),
  ).padStart(2, '0');

  const hours = String(
    date.getHours(),
  ).padStart(2, '0');

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const isValidUrl = (
  value: string,
): boolean => {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
};

/* =========================================================
   Banner Status
   ========================================================= */

const getBannerStatus = (
  banner: Banner,
): BannerStatus => {
  const now = new Date();

  const startDate = new Date(
    banner.startAt,
  );

  const endDate = new Date(
    banner.endAt,
  );

  /*
   * Expired always has highest priority.
   * Even if active=true, an old banner is expired.
   */
  if (
    !Number.isNaN(endDate.getTime()) &&
    now > endDate
  ) {
    return 'expired';
  }

  /*
   * Inactive banners are disabled by admin.
   */
  if (!banner.active) {
    return 'inactive';
  }

  /*
   * Active banner whose start date is in future.
   */
  if (
    !Number.isNaN(startDate.getTime()) &&
    now < startDate
  ) {
    return 'scheduled';
  }

  /*
   * Active and currently within schedule.
   */
  return 'active';
};

const getBannerStatusLabel = (
  status: BannerStatus,
): string => {
  switch (status) {
    case 'active':
      return 'Active';

    case 'scheduled':
      return 'Scheduled';

    case 'inactive':
      return 'Inactive';

    case 'expired':
      return 'Expired';

    default:
      return 'Unknown';
  }
};

/* =========================================================
   Page
   ========================================================= */

export const AdminMarketingPage: React.FC =
  () => {
    const navigate = useNavigate();
    const location = useLocation();

    const {
      id: routeBannerId,
    } = useParams<{
      id: string;
    }>();

    const isCreateRoute =
      location.pathname.endsWith(
        '/marketing/create',
      );

    const isEditRoute =
      Boolean(routeBannerId) &&
      location.pathname.endsWith('/edit');

    const isFormPageOpen =
      isCreateRoute || isEditRoute;

    const [banners, setBanners] =
      useState<Banner[]>([]);

    const [form, setForm] =
      useState<BannerForm>({
        ...initialForm,
      });

    const [editingId, setEditingId] =
      useState<string | null>(null);

    const [loading, setLoading] =
      useState(!isFormPageOpen);

    const [saving, setSaving] =
      useState(false);

    const [error, setError] =
      useState('');

    const [success, setSuccess] =
      useState('');

    const [isOnline, setIsOnline] =
      useState(navigator.onLine);

    /* =====================================================
       Load All Banners
       ===================================================== */

    const loadBanners =
      useCallback(async (): Promise<void> => {
        try {
          setLoading(true);
          setError('');

          const response =
            await http.get<
              ApiResponse<Banner[]>
            >('/admin/banners');

          if (!response.data.success) {
            throw new Error(
              response.data.message ??
                'Unable to load banners.',
            );
          }

          setBanners(
            response.data.data,
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load banners.',
          );
        } finally {
          setLoading(false);
        }
      }, []);

    /* =====================================================
       Load Single Banner
       ===================================================== */

    const loadBannerById =
      useCallback(
        async (
          bannerId: string,
        ): Promise<void> => {
          try {
            setLoading(true);
            setError('');

            const response =
              await http.get<
                ApiResponse<Banner>
              >(
                `/admin/banners/${bannerId}`,
              );

            if (!response.data.success) {
              throw new Error(
                response.data.message ??
                  'Unable to load banner.',
              );
            }

            const banner =
              response.data.data;

            if (!banner) {
              throw new Error(
                'Banner not found.',
              );
            }

            setEditingId(
              banner.id,
            );

            setForm({
              title: banner.title,
              image: banner.image,
              link: banner.link ?? '',
              placement:
                banner.placement,
              startAt:
                getDateTimeLocal(
                  banner.startAt,
                ),
              endAt:
                getDateTimeLocal(
                  banner.endAt,
                ),
              order: banner.order,
              active: banner.active,
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : 'Failed to load banner.',
            );
          } finally {
            setLoading(false);
          }
        },
        [],
      );

    /* =====================================================
       Load List
       ===================================================== */

    useEffect(() => {
      if (!isFormPageOpen) {
        void loadBanners();
      }
    }, [
      isFormPageOpen,
      loadBanners,
    ]);

    /* =====================================================
       Prepare Create Form
       ===================================================== */

    useEffect(() => {
      if (!isCreateRoute) {
        return;
      }

      setEditingId(null);
      setForm({
        ...initialForm,
      });
      setError('');
      setSuccess('');
      setLoading(false);
    }, [isCreateRoute]);

    /* =====================================================
       Prepare Edit Form
       ===================================================== */

    useEffect(() => {
      if (
        isEditRoute &&
        routeBannerId
      ) {
        void loadBannerById(
          routeBannerId,
        );
      }
    }, [
      isEditRoute,
      routeBannerId,
      loadBannerById,
    ]);

    /* =====================================================
       Online / Offline
       ===================================================== */

    useEffect(() => {
      const handleOnline = (): void => {
        setIsOnline(true);
      };

      const handleOffline = (): void => {
        setIsOnline(false);
      };

      window.addEventListener(
        'online',
        handleOnline,
      );

      window.addEventListener(
        'offline',
        handleOffline,
      );

      return () => {
        window.removeEventListener(
          'online',
          handleOnline,
        );

        window.removeEventListener(
          'offline',
          handleOffline,
        );
      };
    }, []);

    /* =====================================================
       Navigation
       ===================================================== */

    const openCreatePage =
      (): void => {
        if (saving) {
          return;
        }

        setEditingId(null);
        setForm({
          ...initialForm,
        });
        setError('');
        setSuccess('');

        navigate(
          '/admin/marketing/create',
        );
      };

    const openEditPage = (
      banner: Banner,
    ): void => {
      if (saving) {
        return;
      }

      const status =
        getBannerStatus(banner);

      /*
       * Inactive and expired banners
       * cannot be edited.
       */
      if (
        status === 'inactive' ||
        status === 'expired'
      ) {
        return;
      }

      setError('');
      setSuccess('');

      navigate(
        `/admin/marketing/${banner.id}/edit`,
      );
    };

    const closeFormPage =
      (): void => {
        if (saving) {
          return;
        }

        setEditingId(null);
        setForm({
          ...initialForm,
        });
        setError('');
        setSuccess('');

        navigate(
          '/admin/marketing',
        );
      };

    /* =====================================================
       Form Changes
       ===================================================== */

    const handleChange = (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement
      >,
    ): void => {
      const {
        name,
        value,
      } = event.target;

      setForm(
        (current) => ({
          ...current,
          [name]:
            name === 'order'
              ? Number(value)
              : value,
        }),
      );
    };

    const handleActiveChange = (
      event: React.ChangeEvent<HTMLInputElement>,
    ): void => {
      setForm(
        (current) => ({
          ...current,
          active:
            event.target.checked,
        }),
      );
    };

    /* =====================================================
       Submit
       ===================================================== */

    const handleSubmit =
      async (
        event: React.FormEvent<HTMLFormElement>,
      ): Promise<void> => {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (!isOnline) {
          setError(
            'You are offline. Please reconnect and try again.',
          );
          return;
        }

        const title =
          form.title.trim();

        const image =
          form.image.trim();

        const link =
          form.link.trim();

        if (!title) {
          setError(
            'Banner title is required.',
          );
          return;
        }

        if (title.length < 2) {
          setError(
            'Banner title must contain at least 2 characters.',
          );
          return;
        }

        if (!image) {
          setError(
            'Banner image URL is required.',
          );
          return;
        }

        if (!isValidUrl(image)) {
          setError(
            'Please enter a valid image URL.',
          );
          return;
        }

        if (
          link &&
          !isValidUrl(link)
        ) {
          setError(
            'Please enter a valid link URL.',
          );
          return;
        }

        if (
          !form.startAt ||
          !form.endAt
        ) {
          setError(
            'Start and end dates are required.',
          );
          return;
        }

        const startDate =
          new Date(
            form.startAt,
          );

        const endDate =
          new Date(
            form.endAt,
          );

        if (
          Number.isNaN(
            startDate.getTime(),
          ) ||
          Number.isNaN(
            endDate.getTime(),
          )
        ) {
          setError(
            'Please enter valid dates.',
          );
          return;
        }

        if (
          endDate <= startDate
        ) {
          setError(
            'End date must be after start date.',
          );
          return;
        }

        if (form.order < 0) {
          setError(
            'Display order cannot be negative.',
          );
          return;
        }

        try {
          setSaving(true);

          const payload = {
            title,
            image,
            link,
            placement:
              form.placement,
            startAt:
              startDate.toISOString(),
            endAt:
              endDate.toISOString(),
            order: form.order,
            active: form.active,
          };

          const response =
            editingId
              ? await http.patch<
                  ApiResponse<Banner>
                >(
                  `/admin/banners/${editingId}`,
                  payload,
                )
              : await http.post<
                  ApiResponse<Banner>
                >(
                  '/admin/banners',
                  payload,
                );

          if (
            !response.data.success
          ) {
            throw new Error(
              response.data.message ??
                'Failed to save banner.',
            );
          }

          setSuccess(
            editingId
              ? 'Banner updated successfully.'
              : 'Banner created successfully.',
          );

          setTimeout(() => {
            navigate(
              '/admin/marketing',
            );
          }, 500);
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to save banner.',
          );
        } finally {
          setSaving(false);
        }
      };

    /* =====================================================
       Delete
       ===================================================== */

    const handleDelete =
      async (
        id: string,
      ): Promise<void> => {
        const confirmed =
          window.confirm(
            'Are you sure you want to delete this banner?',
          );

        if (!confirmed) {
          return;
        }

        if (!isOnline) {
          setError(
            'You are offline. Please reconnect and try again.',
          );
          return;
        }

        try {
          setError('');
          setSuccess('');

          const response =
            await http.delete<
              ApiResponse<null>
            >(
              `/admin/banners/${id}`,
            );

          if (
            !response.data.success
          ) {
            throw new Error(
              response.data.message ??
                'Failed to delete banner.',
            );
          }

          setSuccess(
            'Banner deleted successfully.',
          );

          await loadBanners();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to delete banner.',
          );
        }
      };

    /* =====================================================
       Status Counts
       ===================================================== */

    const statusCounts =
      banners.reduce(
        (counts, banner) => {
          const status =
            getBannerStatus(
              banner,
            );

          counts[status] += 1;

          return counts;
        },
        {
          active: 0,
          scheduled: 0,
          inactive: 0,
          expired: 0,
        },
      );

    /* =====================================================
       FORM PAGE
       ===================================================== */

    if (isFormPageOpen) {
      const isEditMode =
        Boolean(editingId);

      return (
        <div className="marketing-page">
          <div className="marketing-form-page">
            <div className="marketing-form-header">
              <div>
                <button
                  type="button"
                  className="marketing-back-button"
                  onClick={
                    closeFormPage
                  }
                  disabled={saving}
                >
                  ← Back to Marketing
                </button>

                <h1>
                  {isEditMode
                    ? 'Edit Banner'
                    : 'Create Banner'}
                </h1>

                <p>
                  {isEditMode
                    ? 'Update the promotional banner details.'
                    : 'Create a new promotional banner for the application.'}
                </p>
              </div>

              <span
                className={
                  form.active
                    ? 'marketing-form-status marketing-form-status-active'
                    : 'marketing-form-status marketing-form-status-inactive'
                }
              >
                {form.active
                  ? 'Active'
                  : 'Inactive'}
              </span>
            </div>

            {error && (
              <div
                className="marketing-message marketing-error"
                role="alert"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                className="marketing-message marketing-success"
                role="status"
              >
                {success}
              </div>
            )}

            {!isOnline && (
              <div
                className="marketing-message marketing-error"
                role="alert"
              >
                You are currently offline.
                Saving is disabled until the
                connection is restored.
              </div>
            )}

            {loading ? (
              <div
                className="marketing-card marketing-form-card"
                role="status"
              >
                <div className="marketing-loading">
                  Loading banner...
                </div>
              </div>
            ) : (
              <form
                onSubmit={
                  handleSubmit
                }
                className="marketing-card marketing-form-card marketing-full-form"
              >
                {/* =================================================
                    SECTION 01
                   ================================================= */}

                <div className="marketing-form-section">
                  <div className="marketing-section-heading">
                    <span className="marketing-section-number">
                      01
                    </span>

                    <div>
                      <h2>
                        Basic Information
                      </h2>

                      <p>
                        Enter the main
                        information for
                        your banner.
                      </p>
                    </div>
                  </div>

                  <div className="marketing-form-grid">
                    <div className="marketing-field">
                      <label htmlFor="banner-title">
                        Banner Title
                      </label>

                      <input
                        id="banner-title"
                        name="title"
                        type="text"
                        value={
                          form.title
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="Plumbing Special"
                        maxLength={
                          120
                        }
                        required
                      />
                    </div>

                    <div className="marketing-field">
                      <label htmlFor="banner-image">
                        Image URL
                      </label>

                      <input
                        id="banner-image"
                        name="image"
                        type="url"
                        value={
                          form.image
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="https://example.com/banner.jpg"
                        required
                      />

                      <span className="marketing-field-help">
                        Use a publicly accessible HTTPS
                        image URL.
                      </span>
                    </div>

                    <div className="marketing-field marketing-field-full">
                      <label htmlFor="banner-link">
                        Link
                      </label>

                      <input
                        id="banner-link"
                        name="link"
                        type="url"
                        value={
                          form.link
                        }
                        onChange={
                          handleChange
                        }
                        placeholder="https://example.com"
                      />

                      <span className="marketing-field-help">
                        Optional URL opened when the banner
                        is clicked.
                      </span>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    SECTION 02
                   ================================================= */}

                <div className="marketing-form-section">
                  <div className="marketing-section-heading">
                    <span className="marketing-section-number">
                      02
                    </span>

                    <div>
                      <h2>
                        Placement &amp; Display
                      </h2>

                      <p>
                        Choose where the
                        banner should appear
                        and its display order.
                      </p>
                    </div>
                  </div>

                  <div className="marketing-form-grid">
                    <div className="marketing-field">
                      <label htmlFor="banner-placement">
                        Placement
                      </label>

                      <select
                        id="banner-placement"
                        name="placement"
                        value={
                          form.placement
                        }
                        onChange={
                          handleChange
                        }
                      >
                        <option value="HOME">
                          HOME
                        </option>

                        <option value="HOME_TOP">
                          HOME_TOP
                        </option>

                        <option value="HOME_MIDDLE">
                          HOME_MIDDLE
                        </option>

                        <option value="HOME_BOTTOM">
                          HOME_BOTTOM
                        </option>
                      </select>
                    </div>

                    <div className="marketing-field">
                      <label htmlFor="banner-order">
                        Display Order
                      </label>

                      <input
                        id="banner-order"
                        name="order"
                        type="number"
                        min="0"
                        value={
                          form.order
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <span className="marketing-field-help">
                        Lower numbers are displayed first.
                      </span>
                    </div>

                    <div className="marketing-field-full">
                      <label className="marketing-checkbox marketing-checkbox-large">
                        <input
                          type="checkbox"
                          checked={
                            form.active
                          }
                          onChange={
                            handleActiveChange
                          }
                        />

                        <span>
                          <strong>
                            Active
                          </strong>

                          <small>
                            Make this banner
                            available for
                            display.
                          </small>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* =================================================
                    SECTION 03
                   ================================================= */}

                <div className="marketing-form-section">
                  <div className="marketing-section-heading">
                    <span className="marketing-section-number">
                      03
                    </span>

                    <div>
                      <h2>
                        Schedule
                      </h2>

                      <p>
                        Set when this banner
                        should be active.
                      </p>
                    </div>
                  </div>

                  <div className="marketing-date-grid">
                    <div className="marketing-field">
                      <label htmlFor="banner-start">
                        Start Date
                      </label>

                      <input
                        id="banner-start"
                        name="startAt"
                        type="datetime-local"
                        value={
                          form.startAt
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />
                    </div>

                    <div className="marketing-field">
                      <label htmlFor="banner-end">
                        End Date
                      </label>

                      <input
                        id="banner-end"
                        name="endAt"
                        type="datetime-local"
                        value={
                          form.endAt
                        }
                        onChange={
                          handleChange
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* =================================================
                    SECTION 04
                   ================================================= */}

                {form.image && (
                  <div className="marketing-form-section">
                    <div className="marketing-section-heading">
                      <span className="marketing-section-number">
                        04
                      </span>

                      <div>
                        <h2>
                          Preview
                        </h2>

                        <p>
                          Preview how the
                          banner image will
                          appear.
                        </p>
                      </div>
                    </div>

                    <div className="marketing-preview">
                      <img
                        src={
                          form.image
                        }
                        alt={
                          form.title ||
                          'Banner preview'
                        }
                        onError={(
                          event,
                        ) => {
                          event.currentTarget.style.display =
                            'none';
                        }}
                      />

                      <div className="marketing-preview-overlay">
                        <span>
                          {
                            form.placement
                          }
                        </span>

                        <strong>
                          {form.title ||
                            'Banner Title'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* =================================================
                    ACTIONS
                   ================================================= */}

                <div className="marketing-form-actions">
                  <button
                    type="button"
                    className="marketing-cancel-button"
                    onClick={
                      closeFormPage
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      saving ||
                      !isOnline
                    }
                    className="marketing-primary-button"
                  >
                    {saving
                      ? 'Saving...'
                      : isEditMode
                        ? 'Update Banner'
                        : 'Create Banner'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    }

    /* =========================================================
       LIST PAGE
       ========================================================= */

    return (
      <div className="marketing-page">
        <div className="marketing-header marketing-list-header">
          <div>
            <h1>
              Marketing &amp; Banners
            </h1>

            <p>
              Manage promotional banners
              displayed in the application.
            </p>
          </div>

          <button
            type="button"
            className="marketing-create-button"
            onClick={
              openCreatePage
            }
          >
            + Create Banner
          </button>
        </div>

        {error && (
          <div
            className="marketing-message marketing-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="marketing-message marketing-success"
            role="status"
          >
            {success}
          </div>
        )}

        {!isOnline && (
          <div
            className="marketing-message marketing-error"
            role="alert"
          >
            You are currently offline.
            Some actions are unavailable
            until the connection is restored.
          </div>
        )}

        {/* =====================================================
            STATUS SUMMARY
           ===================================================== */}

        <div className="marketing-status-summary">
          <div className="marketing-summary-card marketing-summary-total">
            <span className="marketing-summary-label">
              Total
            </span>

            <strong>
              {banners.length}
            </strong>
          </div>

          <div className="marketing-summary-card marketing-summary-active">
            <span className="marketing-summary-label">
              Active
            </span>

            <strong>
              {statusCounts.active}
            </strong>
          </div>

          <div className="marketing-summary-card marketing-summary-scheduled">
            <span className="marketing-summary-label">
              Scheduled
            </span>

            <strong>
              {statusCounts.scheduled}
            </strong>
          </div>

          <div className="marketing-summary-card marketing-summary-inactive">
            <span className="marketing-summary-label">
              Inactive
            </span>

            <strong>
              {statusCounts.inactive}
            </strong>
          </div>

          <div className="marketing-summary-card marketing-summary-expired">
            <span className="marketing-summary-label">
              Expired
            </span>

            <strong>
              {statusCounts.expired}
            </strong>
          </div>
        </div>

        <section className="marketing-card marketing-list-card">
          <div className="marketing-card-header">
            <div>
              <h2>
                Banners
              </h2>

              <p className="marketing-card-description">
                {banners.length}{' '}
                {banners.length === 1
                  ? 'banner'
                  : 'banners'}{' '}
                configured
              </p>
            </div>

            <button
              type="button"
              className="marketing-refresh-button"
              onClick={() =>
                void loadBanners()
              }
              disabled={
                loading
              }
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div
              className="marketing-loading"
              role="status"
            >
              Loading banners...
            </div>
          ) : banners.length ===
            0 ? (
            <div className="marketing-empty">
              <p className="marketing-empty-title">
                No banners found
              </p>

              <p className="marketing-empty-text">
                Create your first marketing
                banner to get started.
              </p>

              <button
                type="button"
                className="marketing-create-button marketing-empty-button"
                onClick={
                  openCreatePage
                }
              >
                + Create Banner
              </button>
            </div>
          ) : (
            <div className="marketing-banner-list">
              {banners.map(
                (banner) => {
                  const status =
                    getBannerStatus(
                      banner,
                    );

                  const isEditDisabled =
                    status ===
                      'inactive' ||
                    status ===
                      'expired';

                  return (
                    <article
                      key={
                        banner.id
                      }
                      className={`marketing-banner marketing-banner-${status}`}
                    >
                      <div className="marketing-banner-content">
                        <div className="marketing-banner-image">
                          <img
                            src={
                              banner.image
                            }
                            alt={
                              banner.title
                            }
                            loading="lazy"
                            onError={(
                              event,
                            ) => {
                              event.currentTarget.style.display =
                                'none';
                            }}
                          />
                        </div>

                        <div className="marketing-banner-details">
                          <div className="marketing-banner-top">
                            <div>
                              <h3 className="marketing-banner-title">
                                {
                                  banner.title
                                }
                              </h3>

                              <p className="marketing-banner-placement">
                                {
                                  banner.placement
                                }
                              </p>
                            </div>

                            <span
                              className={`marketing-status marketing-status-${status}`}
                            >
                              {getBannerStatusLabel(
                                status,
                              )}
                            </span>
                          </div>

                          <div className="marketing-banner-info">
                            <div>
                              <span className="marketing-info-label">
                                Start
                              </span>

                              <p className="marketing-info-value">
                                {formatDate(
                                  banner.startAt,
                                )}
                              </p>
                            </div>

                            <div>
                              <span className="marketing-info-label">
                                End
                              </span>

                              <p
                                className={`marketing-info-value ${
                                  status ===
                                  'expired'
                                    ? 'marketing-expired-date'
                                    : ''
                                }`}
                              >
                                {formatDate(
                                  banner.endAt,
                                )}
                              </p>
                            </div>

                            <div>
                              <span className="marketing-info-label">
                                Order
                              </span>

                              <p className="marketing-info-value">
                                {
                                  banner.order
                                }
                              </p>
                            </div>

                            <div>
                              <span className="marketing-info-label">
                                Link
                              </span>

                              {banner.link ? (
                                <a
                                  href={
                                    banner.link
                                  }
                                  target="_blank"
                                  rel="noreferrer"
                                  className="marketing-link"
                                >
                                  Open link
                                </a>
                              ) : (
                                <p className="marketing-no-link">
                                  No link
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status explanation */}

                          {status ===
                            'scheduled' && (
                            <div className="marketing-status-message marketing-status-message-scheduled">
                              This banner is scheduled
                              and will become active
                              when the start date arrives.
                            </div>
                          )}

                          {status ===
                            'inactive' && (
                            <div className="marketing-status-message marketing-status-message-inactive">
                              This banner is disabled.
                              Enable it to allow it
                              to be displayed.
                            </div>
                          )}

                          {status ===
                            'expired' && (
                            <div className="marketing-status-message marketing-status-message-expired">
                              This banner has expired
                              and is no longer displayed
                              to customers.
                            </div>
                          )}

                          <div className="marketing-banner-actions">
                            <button
                              type="button"
                              onClick={() =>
                                openEditPage(
                                  banner,
                                )
                              }
                              disabled={
                                isEditDisabled ||
                                saving
                              }
                              title={
                                status ===
                                'expired'
                                  ? 'Expired banners cannot be edited.'
                                  : status ===
                                      'inactive'
                                    ? 'Inactive banners cannot be edited.'
                                    : 'Edit banner'
                              }
                              className="marketing-secondary-button"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleDelete(
                                  banner.id,
                                )
                              }
                              disabled={
                                !isOnline
                              }
                              className="marketing-danger-button"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    );
  };

export default AdminMarketingPage;