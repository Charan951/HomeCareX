import React from 'react';

const BannerSkeleton: React.FC = () => {
  return (
    <section className="w-full bg-white px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-12 sm:px-10 lg:px-16">

          <div className="mx-auto max-w-3xl text-center">

            {/* Small label */}
            <div className="mx-auto h-5 w-28 animate-pulse rounded-full bg-slate-200" />

            {/* Heading */}
            <div className="mx-auto mt-5 h-10 w-full max-w-2xl animate-pulse rounded-lg bg-slate-200" />

            {/* Description */}
            <div className="mx-auto mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-slate-200" />

            <div className="mx-auto mt-2 h-4 w-4/5 max-w-lg animate-pulse rounded bg-slate-200" />

            {/* Button */}
            <div className="mx-auto mt-7 h-12 w-40 animate-pulse rounded-lg bg-slate-200" />

          </div>

        </div>
      </div>
    </section>
  );
};

export default BannerSkeleton;