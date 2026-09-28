// import React from 'react';

// export const AdminPartnersPage: React.FC = () => {
//   return (
//     <div className="admin-page-container p-6">
//       <h1 className="text-2xl font-bold">Admin Partners</h1>
//     </div>
//   );
// };

// export default AdminPartnersPage;

import React, { useMemo, useState } from "react";
import DataTable, {
  Column,
} from "../../../components/tables/DataTable";
import {
  PARTNERS,
  MockPartner,
} from "../../../mocks/partners";

const AdminPartnersPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [kycStatus, setKycStatus] = useState("");
  const [accountStatus, setAccountStatus] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [rating, setRating] = useState("");
  const [acceptance, setAcceptance] = useState("");
  const [completion, setCompletion] = useState("");

  const kycOptions = useMemo(
    () =>
      Array.from(
        new Set(PARTNERS.map((partner) => partner.kycStatus))
      ),
    []
  );

  const accountOptions = useMemo(
    () =>
      Array.from(
        new Set(PARTNERS.map((partner) => partner.accountStatus))
      ),
    []
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(PARTNERS.map((partner) => partner.category))
      ),
    []
  );

  const cityOptions = useMemo(
    () =>
      Array.from(
        new Set(PARTNERS.map((partner) => partner.city))
      ),
    []
  );

  const filteredPartners = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return PARTNERS.filter((partner) => {
      const matchesSearch =
        !searchValue ||
        partner.name.toLowerCase().includes(searchValue) ||
        partner.email.toLowerCase().includes(searchValue) ||
        partner.phone.toLowerCase().includes(searchValue) ||
        partner.city.toLowerCase().includes(searchValue);

      const matchesKyc =
        !kycStatus ||
        partner.kycStatus === kycStatus;

      const matchesAccount =
        !accountStatus ||
        partner.accountStatus === accountStatus;

      const matchesCategory =
        !category ||
        partner.category === category;

      const matchesCity =
        !city ||
        partner.city === city;

      const matchesRating =
        !rating ||
        partner.rating >= Number(rating);

      const matchesAcceptance =
        !acceptance ||
        partner.acceptance >= Number(acceptance);

      const matchesCompletion =
        !completion ||
        partner.completion >= Number(completion);

      return (
        matchesSearch &&
        matchesKyc &&
        matchesAccount &&
        matchesCategory &&
        matchesCity &&
        matchesRating &&
        matchesAcceptance &&
        matchesCompletion
      );
    });
  }, [
    search,
    kycStatus,
    accountStatus,
    category,
    city,
    rating,
    acceptance,
    completion,
  ]);

  const columns: Column<MockPartner>[] = [
    {
      key: "name",
      header: "Partner",
      sortValue: (row) => row.name,
    },
    {
      key: "email",
      header: "Email",
      sortValue: (row) => row.email,
    },
    {
      key: "kycStatus",
      header: "KYC Status",
      sortValue: (row) => row.kycStatus,
      cell: (row) => (
        <span
          className={`partner-status ${
            row.kycStatus.toLowerCase()
          }`}
        >
          {row.kycStatus}
        </span>
      ),
    },
    {
      key: "accountStatus",
      header: "Account Status",
      sortValue: (row) => row.accountStatus,
      cell: (row) => (
        <span
          className={`partner-status ${
            row.accountStatus.toLowerCase()
          }`}
        >
          {row.accountStatus}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortValue: (row) => row.category,
    },
    {
      key: "city",
      header: "City",
      sortValue: (row) => row.city,
    },
    {
      key: "rating",
      header: "Rating",
      sortValue: (row) => row.rating,
      cell: (row) => (
        <span className="partner-rating">
          {row.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "acceptance",
      header: "Acceptance",
      sortValue: (row) => row.acceptance,
      cell: (row) => `${row.acceptance}%`,
    },
    {
      key: "completion",
      header: "Completion",
      sortValue: (row) => row.completion,
      cell: (row) => `${row.completion}%`,
    },
  ];

  const resetFilters = () => {
    setSearch("");
    setKycStatus("");
    setAccountStatus("");
    setCategory("");
    setCity("");
    setRating("");
    setAcceptance("");
    setCompletion("");
  };

  const hasActiveFilters =
    search ||
    kycStatus ||
    accountStatus ||
    category ||
    city ||
    rating ||
    acceptance ||
    completion;

  return (
    <div className="admin-partners-container">
      <div className="admin-partners-header">
        <div>
          <h1 className="admin-partners-title">
            Partners
          </h1>

          <p className="admin-partners-subtitle">
            Search and filter registered service partners.
          </p>
        </div>
      </div>

      <section
        className="partners-filters"
        aria-label="Partner filters"
      >
        <div className="partners-search">
          <label htmlFor="partner-search">
            Search partners
          </label>

          <input
            id="partner-search"
            type="search"
            value={search}
            placeholder="Search name, email, phone or city"
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="partners-filter-grid">
          <div className="partner-filter">
            <label htmlFor="kyc-status">
              KYC Status
            </label>

            <select
              id="kyc-status"
              value={kycStatus}
              onChange={(event) =>
                setKycStatus(event.target.value)
              }
            >
              <option value="">All</option>

              {kycOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="partner-filter">
            <label htmlFor="account-status">
              Account Status
            </label>

            <select
              id="account-status"
              value={accountStatus}
              onChange={(event) =>
                setAccountStatus(event.target.value)
              }
            >
              <option value="">All</option>

              {accountOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="partner-filter">
            <label htmlFor="partner-category">
              Category
            </label>

            <select
              id="partner-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="">All</option>

              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="partner-filter">
            <label htmlFor="partner-city">
              City
            </label>

            <select
              id="partner-city"
              value={city}
              onChange={(event) =>
                setCity(event.target.value)
              }
            >
              <option value="">All</option>

              {cityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="partner-filter">
            <label htmlFor="partner-rating">
              Rating
            </label>

            <select
              id="partner-rating"
              value={rating}
              onChange={(event) =>
                setRating(event.target.value)
              }
            >
              <option value="">Any rating</option>
              <option value="1">1.0+</option>
              <option value="2">2.0+</option>
              <option value="3">3.0+</option>
              <option value="4">4.0+</option>
              <option value="4.5">4.5+</option>
            </select>
          </div>

          <div className="partner-filter">
            <label htmlFor="partner-acceptance">
              Acceptance
            </label>

            <select
              id="partner-acceptance"
              value={acceptance}
              onChange={(event) =>
                setAcceptance(event.target.value)
              }
            >
              <option value="">Any</option>
              <option value="50">50%+</option>
              <option value="70">70%+</option>
              <option value="80">80%+</option>
              <option value="90">90%+</option>
            </select>
          </div>

          <div className="partner-filter">
            <label htmlFor="partner-completion">
              Completion
            </label>

            <select
              id="partner-completion"
              value={completion}
              onChange={(event) =>
                setCompletion(event.target.value)
              }
            >
              <option value="">Any</option>
              <option value="50">50%+</option>
              <option value="70">70%+</option>
              <option value="80">80%+</option>
              <option value="90">90%+</option>
            </select>
          </div>

          <button
            type="button"
            className="partners-reset-btn"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
          >
            Reset filters
          </button>
        </div>
      </section>

      <div className="partners-table-wrapper">
        <DataTable
          columns={columns}
          data={filteredPartners}
          rowKey={(row) => row.id}
          label="Partners"
          defaultPageSize={10}
          pageSizeOptions={[5, 10, 20, 50]}
          emptyTitle="No partners found"
          emptyMessage={
            hasActiveFilters
              ? "No partners match the selected filters."
              : "There are no partners to display."
          }
        />
      </div>

      <div className="partners-count">
        Showing {filteredPartners.length} of{" "}
        {PARTNERS.length} partners
      </div>
    </div>
  );
};

export default AdminPartnersPage;