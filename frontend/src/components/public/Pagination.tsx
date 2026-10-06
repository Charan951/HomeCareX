import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {/* Previous */}
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="rounded-lg border border-[#e0e7ff] bg-white px-4 py-2 text-sm font-semibold text-[#4338ca] transition hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>

      {/* Pages */}
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          className={`min-w-10 rounded-lg px-4 py-2 text-sm font-bold transition ${
            currentPage === page
              ? "bg-[#4338ca] text-white"
              : "border border-[#e0e7ff] bg-white text-[#4338ca] hover:bg-[#eef2ff]"
          }`}
        >
          {page}
        </button>
      ))}

      {/* Next */}
      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="rounded-lg border border-[#e0e7ff] bg-white px-4 py-2 text-sm font-semibold text-[#4338ca] transition hover:bg-[#eef2ff] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;