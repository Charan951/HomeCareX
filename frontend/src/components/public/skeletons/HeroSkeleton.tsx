import React from 'react';

const HeroSkeleton: React.FC = () => {
  return (
    <section className="w-full bg-white px-5 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

          {/* Left Content */}
          <div className="space-y-5">
            {/* Small badge */}
            <div className="h-7 w-40 animate-pulse rounded-full bg-slate-200" />

            {/* Heading */}
            <div className="space-y-3">
              <div className="h-12 w-full max-w-xl animate-pulse rounded-lg bg-slate-200 sm:h-14" />
              <div className="h-12 w-4/5 max-w-lg animate-pulse rounded-lg bg-slate-200 sm:h-14" />
            </div>

            {/* Description */}
            <div className="space-y-2 pt-2">
              <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-5/6 max-w-lg animate-pulse rounded bg-slate-200" />
              <div className="h-4 w-2/3 max-w-md animate-pulse rounded bg-slate-200" />
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200 sm:w-40" />
              <div className="h-12 w-full animate-pulse rounded-lg bg-slate-200 sm:w-40" />
            </div>
          </div>

          {/* Right Image/Card */}
          <div className="relative">
            <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-slate-200" />

            {/* Floating card */}
            <div className="absolute -bottom-5 left-5 hidden h-20 w-52 animate-pulse rounded-xl bg-slate-200 shadow-lg sm:block" />

            {/* Floating card */}
            <div className="absolute -right-4 top-6 hidden h-16 w-40 animate-pulse rounded-xl bg-slate-200 shadow-lg sm:block" />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSkeleton;