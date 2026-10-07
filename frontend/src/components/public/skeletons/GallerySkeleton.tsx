import React from "react";

/* Matches the hero gallery: one big photo with the title area,
   then a row of thumbnails (on every screen size). */
const GallerySkeleton: React.FC = () => (
  <div role="status" aria-busy="true" aria-live="polite">
    <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
      {/* Main photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-[#cfd5f0] sm:aspect-[16/10] lg:aspect-auto lg:h-[32rem]">
        <div className="absolute left-4 top-4 h-9 w-36 rounded-full bg-white/60" />
        <div className="absolute right-4 top-4 h-11 w-11 rounded-full bg-white/60" />

        <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 sm:p-8">
          <div className="hidden h-7 w-24 rounded-full bg-white/50 sm:block" />
          <div className="h-9 w-2/3 rounded-xl bg-white/70 sm:h-12" />
          <div className="h-5 w-1/2 rounded-full bg-white/50" />
        </div>
      </div>

      {/* Thumbnails */}
      <div className="-mx-1 flex gap-3 overflow-hidden px-1 pb-2 pt-1">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="aspect-[3/2] w-24 shrink-0 rounded-2xl bg-[#dbe0f5] sm:w-28 lg:w-36"
          />
        ))}
      </div>
    </div>

    <span className="sr-only">Loading photos...</span>
  </div>
);

export default GallerySkeleton;