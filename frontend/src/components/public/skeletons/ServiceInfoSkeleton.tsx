import React from "react";

/* Desktop: matches the booking card (price panel, slots box, Book now button).
   Mobile: matches the 2 x 2 quick facts grid, because the card is hidden there. */
const ServiceInfoSkeleton: React.FC = () => (
  <div role="status" aria-busy="true" aria-live="polite">
    <div aria-hidden="true" className="motion-safe:animate-pulse">
      {/* Desktop card */}
      <div className="hidden overflow-hidden rounded-[2rem] bg-white shadow-[0_30px_80px_rgba(17,16,79,0.12)] ring-1 ring-[#e4e7f5] lg:block">
        <div className="space-y-5 bg-[#d5daf2] p-8">
          <div className="h-4 w-24 rounded-full bg-white/60" />
          <div className="flex items-end justify-between gap-3">
            <div className="h-14 w-40 rounded-2xl bg-white/70" />
            <div className="h-10 w-28 rounded-full bg-white/60" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-32 rounded-full bg-white/60" />
            <div className="h-5 w-24 rounded-full bg-white/60" />
          </div>
        </div>

        <div className="space-y-5 p-7">
          <div className="flex items-center gap-4 rounded-2xl bg-[#eef0fb] px-5 py-4">
            <div className="h-3 w-3 rounded-full bg-[#cfd5f0]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded-full bg-[#cfd5f0]" />
              <div className="h-3 w-28 rounded-full bg-[#dbe0f5]" />
            </div>
          </div>

          <div className="h-16 w-full rounded-full bg-[#cfd5f0]" />
          <div className="mx-auto h-3 w-3/4 rounded-full bg-[#dbe0f5]" />
        </div>
      </div>

      {/* Mobile quick facts */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-[#e4e7f5] lg:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 bg-white px-4 py-4">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[#cfd5f0]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-16 rounded-full bg-[#dbe0f5]" />
              <div className="h-4 w-20 rounded-full bg-[#cfd5f0]" />
            </div>
          </div>
        ))}
      </div>
    </div>

    <span className="sr-only">Loading service details...</span>
  </div>
);

export default ServiceInfoSkeleton;