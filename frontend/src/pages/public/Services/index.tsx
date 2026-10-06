import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import ServiceCard from "../../../components/public/ServiceCard";

import ServiceFilters, {
  SortOption,
} from "../../../components/public/ServiceFilters";

import Pagination from "../../../components/public/Pagination";


// ============================================================
// SERVICE TYPE
// ============================================================

interface Service {
  id: string;
  image: string;
  category: string;
  name: string;
  rating: number;
  price: number;
  duration: string;
}


// ============================================================
// MOCK SERVICE DATA
// ============================================================

const services: Service[] = [
  {
    id: "SERVICE001",
    image: "/images/home-cleaning.jpg",
    category: "Cleaning",
    name: "Home Cleaning",
    rating: 4.8,
    price: 499,
    duration: "2-3 hrs",
  },

  {
    id: "SERVICE002",
    image: "/images/plumbing.jpg",
    category: "Plumbing",
    name: "Plumbing",
    rating: 4.8,
    price: 399,
    duration: "1-2 hrs",
  },

  {
    id: "SERVICE003",
    image: "/images/electrical.jpg",
    category: "Electrical",
    name: "Electrical Services",
    rating: 4.7,
    price: 349,
    duration: "1-2 hrs",
  },

  {
    id: "SERVICE004",
    image: "/images/appliance-repair.jpg",
    category: "Appliance",
    name: "Appliance Repair",
    rating: 4.8,
    price: 499,
    duration: "2-3 hrs",
  },

  {
    id: "SERVICE005",
    image: "/images/painting.jpg",
    category: "Painting",
    name: "Home Painting",
    rating: 4.7,
    price: 999,
    duration: "1-2 days",
  },

  {
    id: "SERVICE006",
    image: "/images/home-maintenance.jpg",
    category: "Maintenance",
    name: "Home Maintenance",
    rating: 4.8,
    price: 599,
    duration: "2-3 hrs",
  },

  {
    id: "SERVICE007",
    image: "/images/deep-cleaning.jpg",
    category: "Cleaning",
    name: "Deep Cleaning",
    rating: 4.9,
    price: 799,
    duration: "3-4 hrs",
  },

  {
    id: "SERVICE008",
    image: "/images/bathroom-cleaning.jpg",
    category: "Cleaning",
    name: "Bathroom Cleaning",
    rating: 4.8,
    price: 399,
    duration: "1-2 hrs",
  },

  {
    id: "SERVICE009",
    image: "/images/kitchen-cleaning.jpg",
    category: "Cleaning",
    name: "Kitchen Cleaning",
    rating: 4.8,
    price: 449,
    duration: "1-2 hrs",
  },
];


// ============================================================
// ITEMS PER PAGE
// ============================================================

const ITEMS_PER_PAGE = 6;


// ============================================================
// SEARCH DEBOUNCE DELAY (ms)
// ============================================================

const SEARCH_DEBOUNCE_MS = 300;


// ============================================================
// SERVICES PAGE
// ============================================================

export const ServicesPage: React.FC = () => {

  // ==========================================================
  // URL SEARCH PARAMS
  // ==========================================================

  const [searchParams, setSearchParams] = useSearchParams();


  // ==========================================================
  // READ VALUES FROM URL
  // ==========================================================

  const search = searchParams.get("q") ?? "";

  const category =
    searchParams.get("category") ?? "";

  const sort =
    (searchParams.get("sort") as SortOption) ||
    "popular";

  const pincode =
    searchParams.get("pincode") ?? "";

  const currentPageValue =
    Number(searchParams.get("page")) || 1;

  const currentPage =
    currentPageValue < 1 ? 1 : currentPageValue;


  // ==========================================================
  // SEARCH INPUT (typed text, updates instantly)
  // The URL "q" param is updated only after typing pauses
  // for SEARCH_DEBOUNCE_MS.
  // ==========================================================

  const [searchInput, setSearchInput] = useState(search);

  // Keep the box in sync when the URL changes from outside
  // (browser back/forward, page load with ?q=..., Clear Filters)
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Push the typed text to the URL after the user stops typing
  useEffect(() => {

    if (searchInput === search) {
      return undefined;
    }

    const timer = window.setTimeout(() => {

      setSearchParams((previous) => {

        const params = new URLSearchParams(
          previous
        );

        if (searchInput) {
          params.set("q", searchInput);
        } else {
          params.delete("q");
        }

        params.set("page", "1");

        return params;
      });

    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when the typed text changes
  }, [searchInput]);


  // ==========================================================
  // UPDATE URL
  // ==========================================================

  const updateParams = (
    updates: Record<string, string>
  ) => {

    const params = new URLSearchParams(
      searchParams
    );

    Object.entries(updates).forEach(
      ([key, value]) => {

        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }

      }
    );

    setSearchParams(params);
  };


  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearchChange = (
    value: string
  ) => {

    setSearchInput(value);
  };


  // ==========================================================
  // CATEGORY
  // ==========================================================

  const handleCategoryChange = (
    value: string
  ) => {

    updateParams({
      category: value,
      page: "1",
    });
  };


  // ==========================================================
  // SORT
  // ==========================================================

  const handleSortChange = (
    value: SortOption
  ) => {

    updateParams({
      sort: value,
      page: "1",
    });
  };


  // ==========================================================
  // PINCODE
  // ==========================================================

  const handlePincodeChange = (
    value: string
  ) => {

    updateParams({
      pincode: value,
      page: "1",
    });
  };


  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const handleClear = () => {

    setSearchInput("");

    setSearchParams({});
  };


  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const filteredServices = useMemo(() => {

    const searchText =
      search.toLowerCase().trim();

    return [...services]
      .filter((service) => {

        const matchesSearch =
          service.name
            .toLowerCase()
            .includes(searchText) ||

          service.category
            .toLowerCase()
            .includes(searchText);


        const matchesCategory =
          !category ||
          service.category === category;


        return (
          matchesSearch &&
          matchesCategory
        );
      })

      .sort((a, b) => {

        // Popular
        if (sort === "popular") {
          return b.rating - a.rating;
        }

        // Price Low → High
        if (sort === "price-low") {
          return a.price - b.price;
        }

        // Price High → Low
        if (sort === "price-high") {
          return b.price - a.price;
        }

        return 0;
      });

  }, [search, category, sort]);


  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.ceil(
    filteredServices.length /
      ITEMS_PER_PAGE
  );


  // Make sure current page is valid
  const safeCurrentPage =
    Math.min(
      currentPage,
      Math.max(totalPages, 1)
    );


  const startIndex =
    (safeCurrentPage - 1) *
    ITEMS_PER_PAGE;


  const paginatedServices =
    filteredServices.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );


  // ==========================================================
  // PAGE CHANGE
  // ==========================================================

  const handlePageChange = (
    page: number
  ) => {

    updateParams({
      page: String(page),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#f8f9ff] px-4 py-10 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">


        {/* ====================================================
            PAGE HEADER
        ==================================================== */}

        <div className="mb-8 text-center">

          <p className="text-sm font-bold uppercase tracking-wider text-[#6366f1]">
            HomeCareX Services
          </p>


          <h1 className="mt-3 text-3xl font-extrabold text-[#11104f] sm:text-4xl">
            Find the right service for your home
          </h1>


          <p className="mx-auto mt-3 max-w-2xl text-gray-600">
            Browse our professional home services and choose
            the right service for your everyday needs.
          </p>

        </div>


        {/* ====================================================
            FILTERS
        ==================================================== */}

        <ServiceFilters

          q={searchInput}

          category={category}

          sort={sort}

          pincode={pincode}

          onQueryChange={
            handleSearchChange
          }

          onCategoryChange={
            handleCategoryChange
          }

          onSortChange={
            handleSortChange
          }

          onPincodeChange={
            handlePincodeChange
          }

          onClear={handleClear}

        />


        {/* ====================================================
            RESULT COUNT
        ==================================================== */}

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

          <p className="text-sm font-semibold text-[#6b6b8a]">

            {filteredServices.length}

            {" "}

            {filteredServices.length === 1
              ? "service"
              : "services"}

            {" "}found

          </p>


          {category && (
            <p className="text-sm font-semibold text-[#4338ca]">
              Category: {category}
            </p>
          )}

        </div>


        {/* ====================================================
            SERVICE GRID
        ==================================================== */}

        {paginatedServices.length > 0 ? (

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {paginatedServices.map(
              (service) => (

                <ServiceCard
                  key={service.id}

                  id={service.id}

                  image={service.image}

                  category={service.category}

                  name={service.name}

                  rating={service.rating}

                  price={service.price}

                  duration={service.duration}
                />

              )
            )}

          </div>

        ) : (

          /* ==================================================
             EMPTY STATE
          ================================================== */

          <div className="rounded-2xl border border-[#e0e7ff] bg-white px-6 py-16 text-center shadow-sm">

            <div className="mx-auto max-w-md">

              <h2 className="text-xl font-bold text-[#11104f]">
                No services found
              </h2>


              <p className="mt-2 text-gray-600">
                Try searching for a different service or
                selecting another category.
              </p>


              <button
                type="button"
                onClick={handleClear}
                className="mt-6 rounded-xl bg-[#4338ca] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3730a3]"
              >
                Clear Filters
              </button>

            </div>

          </div>
        )}


        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {paginatedServices.length > 0 && (
          <Pagination
            currentPage={safeCurrentPage}
            totalPages={totalPages}
            onPageChange={
              handlePageChange
            }
          />
        )}

      </div>

      {/* =================================================
    SERVICES INFORMATION
================================================= */}

<section className="mt-16 rounded-3xl border border-[#e0e7ff] bg-white px-6 py-10 shadow-sm sm:px-10">
  <div className="mx-auto max-w-5xl">

    <div className="text-center">
      <p className="text-sm font-bold uppercase tracking-wider text-[#6366f1]">
        Why Choose HomeCareX
      </p>

      <h2 className="mt-3 text-2xl font-extrabold text-[#11104f] sm:text-3xl">
        Professional services for every home
      </h2>

      <p className="mx-auto mt-4 max-w-3xl text-gray-600">
        HomeCareX connects you with trusted professionals for
        reliable, convenient, and quality home services.
      </p>
    </div>

    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

      <div className="rounded-2xl bg-[#f8f9ff] p-6">
        <h3 className="text-lg font-bold text-[#11104f]">
          Trusted Professionals
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Get access to experienced service professionals who
          are ready to help with your everyday home needs.
        </p>
      </div>

      <div className="rounded-2xl bg-[#f8f9ff] p-6">
        <h3 className="text-lg font-bold text-[#11104f]">
          Transparent Pricing
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          View starting prices and service details before
          choosing the right service for your home.
        </p>
      </div>

      <div className="rounded-2xl bg-[#f8f9ff] p-6">
        <h3 className="text-lg font-bold text-[#11104f]">
          Convenient Home Services
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-600">
          Find cleaning, plumbing, electrical, appliance repair,
          painting, and maintenance services in one place.
        </p>
      </div>

    </div>

  </div>
</section>

    </main>
  );
};


export default ServicesPage;