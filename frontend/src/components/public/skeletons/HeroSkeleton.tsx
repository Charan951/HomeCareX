import React from "react";

const HeroSkeleton: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="animate-pulse">

          {/* Heading */}
          <div className="mx-auto h-10 max-w-2xl rounded-lg bg-gray-200" />

          {/* Description */}
          <div className="mx-auto mt-4 h-5 max-w-xl rounded bg-gray-200" />

          {/* Search area */}
          <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-4 md:flex-row">

            <div className="h-12 flex-1 rounded-lg bg-gray-200" />

            <div className="h-12 w-full rounded-lg bg-gray-200 md:w-40" />

            <div className="h-12 w-full rounded-lg bg-gray-300 md:w-32" />

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSkeleton;