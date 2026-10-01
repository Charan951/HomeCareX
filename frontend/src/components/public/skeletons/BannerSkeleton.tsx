import React from "react";

const BannerSkeleton: React.FC = () => {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="animate-pulse overflow-hidden rounded-3xl bg-gray-200">
          <div className="min-h-[320px] p-8 sm:p-12 lg:p-16">

            {/* Small label */}
            <div className="h-4 w-28 rounded bg-gray-300" />

            {/* Heading */}
            <div className="mt-5 h-10 w-full max-w-xl rounded bg-gray-300" />
            <div className="mt-3 h-10 w-3/4 max-w-lg rounded bg-gray-300" />

            {/* Description */}
            <div className="mt-6 h-4 w-full max-w-lg rounded bg-gray-300" />
            <div className="mt-2 h-4 w-4/5 max-w-md rounded bg-gray-300" />

            {/* Button */}
            <div className="mt-7 h-12 w-40 rounded-lg bg-gray-300" />

          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerSkeleton;