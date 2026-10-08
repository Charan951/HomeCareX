import React from "react";

/* Matches the Reviews tab: score card with five bars, then three review cards. */
const ReviewSkeleton: React.FC = () => (
  <div role="status" aria-busy="true" aria-live="polite">
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      <div className="h-8 w-32 rounded-xl bg-[#cfd5f0] sm:h-9" />

      {/* Score card */}
      <div className="mt-5 grid gap-8 rounded-[1.75rem] bg-[#d5daf2] p-7 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex flex-col items-center gap-3 sm:pr-8">
          <div className="h-16 w-28 rounded-2xl bg-white/70" />
          <div className="h-5 w-32 rounded-full bg-white/60" />
          <div className="h-4 w-36 rounded-full bg-white/50" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-4 w-10 rounded-full bg-white/60" />
              <div className="h-2.5 flex-1 rounded-full bg-white/60" />
              <div className="h-4 w-10 rounded-full bg-white/60" />
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="mt-5 space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-3xl border border-[#e9ebf7] bg-white p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-full bg-[#cfd5f0]" />
                <div className="space-y-2">
                  <div className="h-4 w-28 rounded-full bg-[#cfd5f0]" />
                  <div className="h-3 w-20 rounded-full bg-[#dbe0f5]" />
                </div>
              </div>
              <div className="h-4 w-24 rounded-full bg-[#dbe0f5]" />
            </div>

            <div className="mt-5 space-y-2.5">
              <div className="h-4 w-full rounded-full bg-[#dbe0f5]" />
              <div className="h-4 w-5/6 rounded-full bg-[#dbe0f5]" />
            </div>

            <div className="mt-5 h-7 w-44 rounded-full bg-[#e6e9f8]" />
          </div>
        ))}
      </div>
    </div>

    <span className="sr-only">Loading reviews...</span>
  </div>
);

export default ReviewSkeleton;