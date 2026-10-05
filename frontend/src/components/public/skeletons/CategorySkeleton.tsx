import React from 'react';

const CategorySkeleton: React.FC = () => {
  return (
    <section className="w-full bg-white px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">

        {/* Section heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mx-auto h-6 w-36 animate-pulse rounded-full bg-slate-200" />

          <div className="mx-auto mt-4 h-9 w-80 max-w-full animate-pulse rounded-lg bg-slate-200" />

          <div className="mx-auto mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-slate-200" />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              {/* Image */}
              <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />

              {/* Content */}
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />

                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />

                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />

                <div className="pt-2">
                  <div className="h-10 w-full animate-pulse rounded-lg bg-slate-200" />
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default CategorySkeleton;