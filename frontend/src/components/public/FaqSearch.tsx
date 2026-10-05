import React from "react";

export interface FaqSearchProps {
  value: string;
  onChange: (query: string) => void;
  onClear: () => void;
  resultCount?: number;
  totalCount?: number;
  className?: string;
}

export const FaqSearch: React.FC<FaqSearchProps> = ({
  value,
  onChange,
  onClear,
  resultCount,
  totalCount,
  className = "",
}) => {
  const hasQuery = value.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape" && hasQuery) {
      e.preventDefault();
      onClear();
    }
  };

  return (
    <div className={`mx-auto w-full max-w-xl ${className}`}>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="relative flex items-center"
      >
        <label htmlFor="faq-search-input" className="sr-only">
          Search frequently asked questions by question or answer keyword
        </label>

        {/* Search icon */}
        <span
          className="pointer-events-none absolute left-3.5 flex h-5 w-5 items-center justify-center text-[#4338ca]"
          aria-hidden="true"
        >
          <svg
            className="h-4.5 w-4.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012 12z"
            />
          </svg>
        </span>

        {/* Search Input - Clean single highlight line, no browser-native duplicate X */}
        <input
          id="faq-search-input"
          type="text"
          role="searchbox"
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search questions or answers (e.g. refund, booking, slots)..."
          className="w-full rounded-xl border border-[#4338ca]/25 bg-white py-2.5 pl-10 pr-10 text-sm text-[#1b1b3a] shadow-xs placeholder:text-[#5b5b7a]/60 transition duration-150 hover:border-[#4338ca]/50 focus:border-[#ff8a3d] focus:outline-none focus:ring-1 focus:ring-[#ff8a3d] sm:py-3 sm:pl-11 sm:pr-11 sm:text-base [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
          aria-describedby="faq-search-help"
        />

        {/* Single polished Clear Button */}
        {hasQuery && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear search keyword"
            className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-[#5b5b7a] transition hover:bg-[#eef0ff] hover:text-[#1e1b6e] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#ff8a3d]"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </form>

      {/* Screen reader live announcement & subtle helper text */}
      <div id="faq-search-help" className="mt-1 flex items-center justify-between px-1.5 text-[11px] text-[#5b5b7a] sm:text-xs">
        <span>Search filters questions and answers instantly</span>
        {hasQuery && typeof resultCount === "number" && (
          <span className="font-semibold text-[#4338ca]">
            {resultCount} {resultCount === 1 ? "match" : "matches"}
            {typeof totalCount === "number" && ` of ${totalCount}`}
          </span>
        )}
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {hasQuery && typeof resultCount === "number"
          ? `${resultCount} ${resultCount === 1 ? "result" : "results"} found for "${value.trim()}"`
          : ""}
      </div>
    </div>
  );
};

export default FaqSearch;
