import React from 'react';

const TestimonialSkeleton: React.FC = () => {
  return (
    <section className="w-full bg-white px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mx-auto h-6 w-32 animate-pulse rounded-full bg-slate-200" />

          <div className="mx-auto mt-4 h-9 w-72 max-w-full animate-pulse rounded-lg bg-slate-200" />

          <div className="mx-auto mt-3 h-4 w-full max-w-lg animate-pulse rounded bg-slate-200" />
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              {/* Stars */}
              <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />

              {/* Quote */}
              <div className="mt-5 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
              </div>

              {/* User */}
              <div className="mt-6 flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-slate-200" />

                <div className="space-y-2">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            </div>
          ))}

        </div>
      </div>
    </section>
  );
};

export default TestimonialSkeleton;