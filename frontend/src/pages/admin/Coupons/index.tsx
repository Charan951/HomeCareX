
import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import http, { type ApiResponse } from "@/lib/http";
import "./index.css";

type CouponType = "PERCENT" | "FLAT";
type CouponStatus = "all" | "active" | "inactive" | "expired";

interface CouponCategoryReference {
  id?: string;
  _id?: string;
  name?: string;
}

interface Coupon {
  id: string;
  _id?: string;
  code: string;
  type: CouponType;
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  startAt: string;
  endAt: string;
  totalLimit: number | null;
  perUserLimit: number | null;
  usedCount: number;
  categoryIds: Array<string | CouponCategoryReference>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id?: string;
  _id?: string;
  name: string;
  active: boolean;
}

interface CouponForm {
  code: string;
  type: CouponType;
  value: string;
  maxDiscount: string;
  minOrder: string;
  startAt: string;
  endAt: string;
  totalLimit: string;
  perUserLimit: string;
  categoryIds: string[];
  active: boolean;
}

/*
 * MOCK MODE
 * Keep true until the backend endpoints are ready.
 * Mock changes persist in this browser's localStorage.
 */
const USE_ADMIN_MOCKS = true;

const COUPONS_STORAGE_KEY = "homecarex_admin_coupons_v1";
const CATEGORIES_STORAGE_KEY = "homecarex_admin_categories_v1";

const getCategoryId = (category: Category): string =>
  String(category.id ?? category._id ?? "");

const getCategoryReferenceId = (
  value: string | CouponCategoryReference,
): string => {
  if (typeof value === "string") return value;
  return String(value.id ?? value._id ?? "");
};

const getDateTimeLocal = (date: Date): string => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000)
    .toISOString()
    .slice(0, 16);
};

const getInitialForm = (): CouponForm => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 30);

  return {
    code: "",
    type: "PERCENT",
    value: "",
    maxDiscount: "",
    minOrder: "0",
    startAt: getDateTimeLocal(start),
    endAt: getDateTimeLocal(end),
    totalLimit: "",
    perUserLimit: "",
    categoryIds: [],
    active: true,
  };
};

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "response" in error) {
    const response = (
      error as {
        response?: { data?: { message?: string } };
      }
    ).response;

    if (response?.data?.message) return response.data.message;
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
};

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatValue = (coupon: Coupon): string =>
  coupon.type === "PERCENT"
    ? `${coupon.value}%`
    : `₹${coupon.value.toLocaleString("en-IN")}`;

const isCouponExpired = (coupon: Coupon): boolean => {
  const endDate = new Date(coupon.endAt);
  return (
    !Number.isNaN(endDate.getTime()) &&
    endDate.getTime() < Date.now()
  );
};

const isCouponInactive = (coupon: Coupon): boolean =>
  !coupon.active && !isCouponExpired(coupon);

const isCouponLocked = (coupon: Coupon): boolean =>
  isCouponExpired(coupon) || isCouponInactive(coupon);

const getCouponSeedData = (): Coupon[] => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - 1);

  const future = new Date(now);
  future.setDate(future.getDate() + 30);

  const expiredStart = new Date(now);
  expiredStart.setDate(expiredStart.getDate() - 60);

  const expiredEnd = new Date(now);
  expiredEnd.setDate(expiredEnd.getDate() - 1);

  const inactiveEnd = new Date(now);
  inactiveEnd.setDate(inactiveEnd.getDate() + 20);

  const timestamp = now.toISOString();

  return [
    {
      id: "mock-coupon-welcome10",
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      maxDiscount: 300,
      minOrder: 500,
      startAt: start.toISOString(),
      endAt: future.toISOString(),
      totalLimit: 100,
      perUserLimit: 1,
      usedCount: 24,
      categoryIds: [],
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "mock-coupon-save200",
      code: "SAVE200",
      type: "FLAT",
      value: 200,
      maxDiscount: null,
      minOrder: 500,
      startAt: start.toISOString(),
      endAt: future.toISOString(),
      totalLimit: 200,
      perUserLimit: 1,
      usedCount: 45,
      categoryIds: [],
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "mock-coupon-inactive",
      code: "PAUSED50",
      type: "FLAT",
      value: 50,
      maxDiscount: null,
      minOrder: 200,
      startAt: start.toISOString(),
      endAt: inactiveEnd.toISOString(),
      totalLimit: 50,
      perUserLimit: 1,
      usedCount: 8,
      categoryIds: [],
      active: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: "mock-coupon-expired",
      code: "OLDDEAL",
      type: "FLAT",
      value: 100,
      maxDiscount: null,
      minOrder: 500,
      startAt: expiredStart.toISOString(),
      endAt: expiredEnd.toISOString(),
      totalLimit: 100,
      perUserLimit: 1,
      usedCount: 30,
      categoryIds: [],
      active: true,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
};

const getMockCategories = (): Category[] => [
  { id: "mock-category-cleaning", name: "Home Cleaning", active: true },
  {
    id: "mock-category-repair",
    name: "Appliance Repair & Service",
    active: true,
  },
  { id: "mock-category-salon", name: "Salon & Spa", active: true },
  {
    id: "mock-category-plumbing",
    name: "Electrical & Plumbing",
    active: true,
  },
  { id: "mock-category-pest", name: "Pest Control", active: true },
];

const readMockList = <T,>(key: string, seed: () => T[]): T[] => {
  const saved = localStorage.getItem(key);

  if (saved !== null) {
    try {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // Re-create the initial records if saved JSON is invalid.
    }
  }

  const initial = seed();
  localStorage.setItem(key, JSON.stringify(initial));
  return initial;
};

const writeMockList = <T,>(key: string, items: T[]): void => {
  localStorage.setItem(key, JSON.stringify(items));
};

export const AdminCouponsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeCouponId } = useParams<{ id: string }>();

  const isCreateRoute = location.pathname.endsWith("/coupons/create");
  const isEditRoute = Boolean(routeCouponId);
  const isFormPageOpen = isCreateRoute || isEditRoute;

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CouponStatus>("all");
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(getInitialForm());

  const loadCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      let loadedCoupons: Coupon[];

      if (USE_ADMIN_MOCKS) {
        loadedCoupons = readMockList<Coupon>(
          COUPONS_STORAGE_KEY,
          getCouponSeedData,
        );

        if (search.trim()) {
          const query = search.trim().toLowerCase();
          loadedCoupons = loadedCoupons.filter((coupon) =>
            coupon.code.toLowerCase().includes(query),
          );
        }
      } else {
        const params: Record<string, string> = {};
        if (search.trim()) params.search = search.trim();

        const response = await http.get<ApiResponse<Coupon[]>>(
          "/admin/coupons",
          { params },
        );
        loadedCoupons = response.data.data ?? [];
      }

      if (statusFilter === "active") {
        loadedCoupons = loadedCoupons.filter(
          (coupon) => coupon.active && !isCouponExpired(coupon),
        );
      } else if (statusFilter === "inactive") {
        loadedCoupons = loadedCoupons.filter(isCouponInactive);
      } else if (statusFilter === "expired") {
        loadedCoupons = loadedCoupons.filter(isCouponExpired);
      }

      setCoupons(loadedCoupons);
    } catch (err) {
      setError(getErrorMessage(err));
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  const loadCategories = useCallback(async () => {
    try {
      if (USE_ADMIN_MOCKS) {
        setCategories(
          readMockList<Category>(CATEGORIES_STORAGE_KEY, getMockCategories),
        );
        return;
      }

      const response = await http.get<ApiResponse<Category[]>>(
        "/admin/categories",
      );

      const normalized = (response.data.data ?? [])
        .map((category) => ({
          id: getCategoryId(category),
          _id: category._id,
          name: category.name,
          active: category.active !== false,
        }))
        .filter((category) => category.id && category.name);

      setCategories(normalized);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadCouponById = useCallback(async (couponId: string) => {
    try {
      setLoading(true);
      setError("");

      let coupon: Coupon | undefined;

      if (USE_ADMIN_MOCKS) {
        coupon = readMockList<Coupon>(
          COUPONS_STORAGE_KEY,
          getCouponSeedData,
        ).find((item) => item.id === couponId);
      } else {
        const response = await http.get<ApiResponse<Coupon>>(
          `/admin/coupons/${couponId}`,
        );
        coupon = response.data.data;
      }

      if (!coupon) throw new Error("Coupon not found.");

      if (isCouponLocked(coupon)) {
        setEditingCouponId(null);
        setError(
          isCouponExpired(coupon)
            ? "This coupon is expired and cannot be edited."
            : "This coupon is inactive and cannot be edited.",
        );
        return;
      }

      setEditingCouponId(coupon.id);
      setForm({
        code: coupon.code,
        type: coupon.type,
        value: String(coupon.value),
        maxDiscount:
          coupon.maxDiscount === null ? "" : String(coupon.maxDiscount),
        minOrder: String(coupon.minOrder),
        startAt: getDateTimeLocal(new Date(coupon.startAt)),
        endAt: getDateTimeLocal(new Date(coupon.endAt)),
        totalLimit:
          coupon.totalLimit === null ? "" : String(coupon.totalLimit),
        perUserLimit:
          coupon.perUserLimit === null ? "" : String(coupon.perUserLimit),
        categoryIds: (coupon.categoryIds ?? [])
          .map(getCategoryReferenceId)
          .filter(Boolean),
        active: coupon.active,
      });
    } catch (err) {
      setEditingCouponId(null);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFormPageOpen) void loadCoupons();
  }, [isFormPageOpen, loadCoupons]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    if (isCreateRoute) {
      setEditingCouponId(null);
      setForm(getInitialForm());
      setError("");
      setLoading(false);
    }
  }, [isCreateRoute]);

  useEffect(() => {
    if (isEditRoute && routeCouponId) {
      void loadCouponById(routeCouponId);
    }
  }, [isEditRoute, routeCouponId, loadCouponById]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const updateForm = <K extends keyof CouponForm>(
    field: K,
    value: CouponForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    setForm((current) => {
      const exists = current.categoryIds.includes(categoryId);
      return {
        ...current,
        categoryIds: exists
          ? current.categoryIds.filter((id) => id !== categoryId)
          : [...current.categoryIds, categoryId],
      };
    });
  };

  const getCategoryNames = (
    categoryIds?: Array<string | CouponCategoryReference>,
  ): string[] => {
    if (!categoryIds?.length) return [];

    return categoryIds
      .map((category) => {
        if (typeof category !== "string" && category.name) {
          return category.name;
        }

        const categoryId = getCategoryReferenceId(category);
        return (
          categories.find((item) => getCategoryId(item) === categoryId)?.name ??
          ""
        );
      })
      .filter(Boolean);
  };

  const openCreatePage = () => {
    if (saving) return;
    setEditingCouponId(null);
    setForm(getInitialForm());
    setError("");
    navigate("/admin/coupons/create");
  };

  const openEditPage = (coupon: Coupon) => {
    if (saving || isCouponLocked(coupon)) return;
    setError("");
    navigate(`/admin/coupons/${coupon.id}/edit`);
  };

  const closeFormPage = () => {
    if (saving) return;
    setEditingCouponId(null);
    setForm(getInitialForm());
    setError("");
    navigate("/admin/coupons");
  };

  const saveCoupon = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.code.trim()) {
      setError("Coupon code is required.");
      return;
    }

    const value = Number(form.value);
    if (!Number.isFinite(value) || value < 0) {
      setError("Enter a valid coupon value.");
      return;
    }

    if (form.type === "PERCENT" && value > 100) {
      setError("Percentage value cannot exceed 100.");
      return;
    }

    const maxDiscount =
      form.maxDiscount.trim() === "" ? null : Number(form.maxDiscount);

    if (
      maxDiscount !== null &&
      (!Number.isFinite(maxDiscount) || maxDiscount < 0)
    ) {
      setError("Enter a valid maximum discount.");
      return;
    }

    const minOrder = Number(form.minOrder || 0);
    if (!Number.isFinite(minOrder) || minOrder < 0) {
      setError("Enter a valid minimum order amount.");
      return;
    }

    const totalLimit =
      form.totalLimit.trim() === "" ? null : Number(form.totalLimit);

    if (
      totalLimit !== null &&
      (!Number.isInteger(totalLimit) || totalLimit < 0)
    ) {
      setError("Total usage limit must be a valid whole number.");
      return;
    }

    const perUserLimit =
      form.perUserLimit.trim() === "" ? null : Number(form.perUserLimit);

    if (
      perUserLimit !== null &&
      (!Number.isInteger(perUserLimit) || perUserLimit < 0)
    ) {
      setError("Per-user limit must be a valid whole number.");
      return;
    }

    if (!form.startAt || !form.endAt) {
      setError("Start and end dates are required.");
      return;
    }

    const startAt = new Date(form.startAt);
    const endAt = new Date(form.endAt);

    if (
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      setError("Enter valid start and end dates.");
      return;
    }

    if (endAt <= startAt) {
      setError("End date must be after start date.");
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      maxDiscount,
      minOrder,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      totalLimit,
      perUserLimit,
      categoryIds: form.categoryIds,
      active: form.active,
    };

    try {
      setSaving(true);
      setError("");

      if (USE_ADMIN_MOCKS) {
        const savedCoupons = readMockList<Coupon>(
          COUPONS_STORAGE_KEY,
          getCouponSeedData,
        );
        const now = new Date().toISOString();

        if (editingCouponId) {
          const existing = savedCoupons.find(
            (coupon) => coupon.id === editingCouponId,
          );

          if (!existing) throw new Error("Coupon not found.");
          if (isCouponLocked(existing)) {
            throw new Error("Inactive or expired coupons cannot be edited.");
          }

          const updated: Coupon = {
            ...existing,
            ...payload,
            updatedAt: now,
          };

          writeMockList(
            COUPONS_STORAGE_KEY,
            savedCoupons.map((coupon) =>
              coupon.id === editingCouponId ? updated : coupon,
            ),
          );
        } else {
          const duplicate = savedCoupons.some(
            (coupon) => coupon.code.toUpperCase() === payload.code,
          );

          if (duplicate) throw new Error("This coupon code already exists.");

          const created: Coupon = {
            id: `mock-coupon-${Date.now()}`,
            ...payload,
            usedCount: 0,
            createdAt: now,
            updatedAt: now,
          };

          writeMockList(COUPONS_STORAGE_KEY, [created, ...savedCoupons]);
        }
      } else if (editingCouponId) {
        await http.patch<ApiResponse<Coupon>>(
          `/admin/coupons/${editingCouponId}`,
          payload,
        );
      } else {
        await http.post<ApiResponse<Coupon>>("/admin/coupons", payload);
      }

      setEditingCouponId(null);
      setForm(getInitialForm());
      navigate("/admin/coupons");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete coupon "${coupon.code}"?`,
    );
    if (!confirmed) return;

    try {
      setError("");

      if (USE_ADMIN_MOCKS) {
        const savedCoupons = readMockList<Coupon>(
          COUPONS_STORAGE_KEY,
          getCouponSeedData,
        );

        writeMockList(
          COUPONS_STORAGE_KEY,
          savedCoupons.filter((item) => item.id !== coupon.id),
        );
      } else {
        await http.delete<ApiResponse<{ ok: boolean }>>(
          `/admin/coupons/${coupon.id}`,
        );
      }

      await loadCoupons();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isFormPageOpen) {
    if (isEditRoute && loading) {
      return (
        <div className="admin-coupon-form-page">
          <button
            type="button"
            className="admin-coupon-back-btn"
            onClick={closeFormPage}
          >
            ← Back to Coupons
          </button>
          <div className="admin-coupons-state">
            <p className="admin-coupons-state-title">Loading coupon...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="admin-coupon-form-page">
        <div className="admin-coupon-form-page-header">
          <button
            type="button"
            className="admin-coupon-back-btn"
            onClick={closeFormPage}
            disabled={saving}
          >
            ← Back to Coupons
          </button>

          <div className="admin-coupon-form-heading">
            <div>
              <h1 className="admin-coupons-title">
                {editingCouponId ? "Update Coupon" : "Create Coupon"}
              </h1>
              <p className="admin-coupons-subtitle">
                Create a promotional coupon with discount rules, validity and
                usage limits.
              </p>
            </div>
            <div className="admin-coupon-form-status">
              <span
                className={
                  form.active
                    ? "admin-coupon-form-status-active"
                    : "admin-coupon-form-status-inactive"
                }
              >
                {form.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {!isOnline && (
          <div className="admin-coupons-offline">
            Mock changes are saved locally in this browser.
          </div>
        )}
        {error && <div className="admin-coupons-error">{error}</div>}

        <form className="admin-coupon-form-card" onSubmit={saveCoupon}>
          <section className="admin-coupon-form-section">
            <div className="admin-coupon-section-heading">
              <div className="admin-coupon-section-number">01</div>
              <div>
                <h2>Basic Information</h2>
                <p>Configure the coupon code and discount type.</p>
              </div>
            </div>

            <div className="admin-coupons-form-grid">
              <div className="admin-coupons-form-group">
                <label htmlFor="coupon-code" className="admin-coupons-form-label">
                  Coupon Code *
                </label>
                <input
                  id="coupon-code"
                  type="text"
                  value={form.code}
                  onChange={(event) =>
                    updateForm(
                      "code",
                      event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""),
                    )
                  }
                  placeholder="WELCOME10"
                  maxLength={30}
                  className="admin-coupons-form-input"
                  required
                />
                <span className="admin-coupons-form-help">
                  Use uppercase letters, numbers, underscore or hyphen.
                </span>
              </div>

              <div className="admin-coupons-form-group">
                <label htmlFor="coupon-type" className="admin-coupons-form-label">
                  Coupon Type *
                </label>
                <select
                  id="coupon-type"
                  value={form.type}
                  onChange={(event) =>
                    updateForm("type", event.target.value as CouponType)
                  }
                  className="admin-coupons-form-select"
                >
                  <option value="PERCENT">Percentage</option>
                  <option value="FLAT">Flat Amount</option>
                </select>
              </div>

              <div className="admin-coupons-form-group">
                <label htmlFor="coupon-value" className="admin-coupons-form-label">
                  Discount Value *
                </label>
                <div className="admin-coupon-input-with-prefix">
                  <span>{form.type === "PERCENT" ? "%" : "₹"}</span>
                  <input
                    id="coupon-value"
                    type="number"
                    min="0"
                    max={form.type === "PERCENT" ? "100" : undefined}
                    step="0.01"
                    value={form.value}
                    onChange={(event) => updateForm("value", event.target.value)}
                    placeholder={form.type === "PERCENT" ? "10" : "200"}
                    className="admin-coupons-form-input"
                    required
                  />
                </div>
              </div>

              <div className="admin-coupons-form-group">
                <label
                  htmlFor="coupon-max-discount"
                  className="admin-coupons-form-label"
                >
                  Maximum Discount
                </label>
                <div className="admin-coupon-input-with-prefix">
                  <span>₹</span>
                  <input
                    id="coupon-max-discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.maxDiscount}
                    onChange={(event) =>
                      updateForm("maxDiscount", event.target.value)
                    }
                    placeholder="300"
                    className="admin-coupons-form-input"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="admin-coupon-form-section">
            <div className="admin-coupon-section-heading">
              <div className="admin-coupon-section-number">02</div>
              <div>
                <h2>Order Rules</h2>
                <p>Define the minimum order amount and applicable categories.</p>
              </div>
            </div>

            <div className="admin-coupons-form-grid">
              <div className="admin-coupons-form-group">
                <label
                  htmlFor="coupon-min-order"
                  className="admin-coupons-form-label"
                >
                  Minimum Order Amount
                </label>
                <div className="admin-coupon-input-with-prefix">
                  <span>₹</span>
                  <input
                    id="coupon-min-order"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.minOrder}
                    onChange={(event) => updateForm("minOrder", event.target.value)}
                    className="admin-coupons-form-input"
                  />
                </div>
              </div>

              <div className="admin-coupons-form-group">
                <label
                  htmlFor="coupon-total-limit"
                  className="admin-coupons-form-label"
                >
                  Total Usage Limit
                </label>
                <input
                  id="coupon-total-limit"
                  type="number"
                  min="0"
                  step="1"
                  value={form.totalLimit}
                  onChange={(event) =>
                    updateForm("totalLimit", event.target.value)
                  }
                  placeholder="100"
                  className="admin-coupons-form-input"
                />
                <span className="admin-coupons-form-help">
                  Leave empty for unlimited usage.
                </span>
              </div>

              <div className="admin-coupons-form-group">
                <label
                  htmlFor="coupon-user-limit"
                  className="admin-coupons-form-label"
                >
                  Per User Usage Limit
                </label>
                <input
                  id="coupon-user-limit"
                  type="number"
                  min="0"
                  step="1"
                  value={form.perUserLimit}
                  onChange={(event) =>
                    updateForm("perUserLimit", event.target.value)
                  }
                  placeholder="1"
                  className="admin-coupons-form-input"
                />
                <span className="admin-coupons-form-help">
                  Leave empty for unlimited usage per user.
                </span>
              </div>
            </div>

            <div className="admin-coupons-form-group admin-coupon-category-group">
              <span className="admin-coupons-form-label">
                Applicable Categories
              </span>

              {categories.filter((category) => category.active).length === 0 ? (
                <div className="admin-coupons-form-help admin-coupon-no-categories">
                  No categories available.
                </div>
              ) : (
                <div className="admin-coupons-category-list">
                  {categories
                    .filter((category) => category.active)
                    .map((category) => {
                      const categoryId = getCategoryId(category);
                      return (
                        <label
                          key={categoryId}
                          className={
                            form.categoryIds.includes(categoryId)
                              ? "admin-coupons-category-item selected"
                              : "admin-coupons-category-item"
                          }
                        >
                          <input
                            type="checkbox"
                            checked={form.categoryIds.includes(categoryId)}
                            onChange={() => toggleCategory(categoryId)}
                            className="admin-coupons-checkbox"
                          />
                          <span>{category.name}</span>
                        </label>
                      );
                    })}
                </div>
              )}

              <span className="admin-coupons-form-help">
                Select categories if this coupon should only apply to specific
                services.
              </span>
            </div>
          </section>

          <section className="admin-coupon-form-section">
            <div className="admin-coupon-section-heading">
              <div className="admin-coupon-section-number">03</div>
              <div>
                <h2>Validity Period</h2>
                <p>Choose when customers can use this coupon.</p>
              </div>
            </div>

            <div className="admin-coupons-form-grid">
              <div className="admin-coupons-form-group">
                <label htmlFor="coupon-start" className="admin-coupons-form-label">
                  Start Date &amp; Time *
                </label>
                <input
                  id="coupon-start"
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => updateForm("startAt", event.target.value)}
                  className="admin-coupons-form-input"
                  required
                />
              </div>

              <div className="admin-coupons-form-group">
                <label htmlFor="coupon-end" className="admin-coupons-form-label">
                  End Date &amp; Time *
                </label>
                <input
                  id="coupon-end"
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => updateForm("endAt", event.target.value)}
                  className="admin-coupons-form-input"
                  required
                />
              </div>
            </div>
          </section>

          <section className="admin-coupon-form-section">
            <div className="admin-coupon-section-heading">
              <div className="admin-coupon-section-number">04</div>
              <div>
                <h2>Coupon Status</h2>
                <p>Control whether customers can currently use this coupon.</p>
              </div>
            </div>

            <label className="admin-coupon-active-card">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) => updateForm("active", event.target.checked)}
                className="admin-coupons-checkbox"
              />
              <span className="admin-coupon-active-content">
                <strong>Coupon is active</strong>
                <small>
                  Active coupons can be validated and used by customers.
                </small>
              </span>
            </label>
          </section>

          <div className="admin-coupon-form-footer">
            <button
              type="button"
              className="admin-coupons-cancel-btn"
              onClick={closeFormPage}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-coupons-submit-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingCouponId
                  ? "Update Coupon"
                  : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-coupons-page">
      <div className="admin-coupons-header">
        <div>
          <h1 className="admin-coupons-title">Coupons</h1>
          <p className="admin-coupons-subtitle">
            Create and manage promotional coupons.
          </p>
        </div>
        <button
          type="button"
          className="admin-coupons-create-btn"
          onClick={openCreatePage}
        >
          + Create Coupon
        </button>
      </div>

      {!isOnline && (
        <div className="admin-coupons-offline">
          You are offline. Mock coupon changes are saved locally in this browser.
        </div>
      )}

      {error && <div className="admin-coupons-error">{error}</div>}

      <div className="admin-coupons-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search coupon code..."
          className="admin-coupons-input"
          aria-label="Search coupons"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as CouponStatus)
          }
          className="admin-coupons-select"
          aria-label="Filter coupons"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      <div className="admin-coupons-card">
        {loading ? (
          <div className="admin-coupons-state">
            <p className="admin-coupons-state-title">Loading coupons...</p>
          </div>
        ) : coupons.length === 0 ? (
          <div className="admin-coupons-empty-state">
            <div className="admin-coupons-empty-icon">%</div>
            <h2>No coupons found</h2>
            <p>Create your first coupon to get started.</p>
            <button
              type="button"
              className="admin-coupons-create-btn"
              onClick={openCreatePage}
            >
              Create Coupon
            </button>
          </div>
        ) : (
          <div className="admin-coupons-table-wrapper">
            <table className="admin-coupons-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Min Order</th>
                  <th>Category</th>
                  <th>Validity</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const expired = isCouponExpired(coupon);
                  const inactive = isCouponInactive(coupon);
                  const locked = isCouponLocked(coupon);
                  const categoryNames = getCategoryNames(coupon.categoryIds);
                  const statusLabel = expired
                    ? "Expired"
                    : inactive
                      ? "Inactive"
                      : "Active";

                  return (
                    <tr
                      key={coupon.id}
                      className={locked ? "admin-coupon-row-disabled" : ""}
                    >
                      <td>
                        <div className="admin-coupon-code-cell">
                          {locked && (
                            <span
                              className="admin-coupon-lock"
                              title={expired ? "Coupon is expired" : "Coupon is inactive"}
                              aria-label={expired ? "Coupon is expired" : "Coupon is inactive"}
                            >
                              🔒
                            </span>
                          )}
                          <span className="admin-coupon-code">{coupon.code}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`admin-coupon-badge ${
                            coupon.type === "PERCENT"
                              ? "admin-coupon-badge-percent"
                              : "admin-coupon-badge-flat"
                          }`}
                        >
                          {coupon.type === "PERCENT" ? "Percentage" : "Flat"}
                        </span>
                      </td>

                      <td>{formatValue(coupon)}</td>
                      <td>₹{coupon.minOrder.toLocaleString("en-IN")}</td>

                      <td>
                        {categoryNames.length === 0 ? (
                          <span className="admin-coupon-muted">All Categories</span>
                        ) : (
                          <div className="admin-coupon-category-cell">
                            {categoryNames.map((name, index) => (
                              <span
                                key={`${name}-${index}`}
                                className="admin-coupon-category-tag"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td>
                        <div>{formatDate(coupon.startAt)}</div>
                        <div className="admin-coupon-muted">
                          to {formatDate(coupon.endAt)}
                        </div>
                      </td>

                      <td>
                        {coupon.usedCount} /{" "}
                        {coupon.totalLimit === null ? "∞" : coupon.totalLimit}
                      </td>

                      <td>
                        <span
                          className={`admin-coupon-badge ${
                            expired
                              ? "admin-coupon-badge-expired"
                              : inactive
                                ? "admin-coupon-badge-inactive"
                                : "admin-coupon-badge-active"
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      <td>
                        <div className="admin-coupons-actions">
                          <button
                            type="button"
                            className={`admin-coupons-action-btn ${
                              locked ? "admin-coupons-action-disabled" : ""
                            }`}
                            onClick={() => openEditPage(coupon)}
                            disabled={locked}
                            title={
                              expired
                                ? "Expired coupons cannot be edited"
                                : inactive
                                  ? "Inactive coupons cannot be edited"
                                  : "Edit coupon"
                            }
                          >
                            {locked ? "🔒 Locked" : "Edit"}
                          </button>
                          <button
                            type="button"
                            className="admin-coupons-action-btn delete"
                            onClick={() => void deleteCoupon(coupon)}
                            title="Delete coupon"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCouponsPage;