import React from "react";

const TestimonialSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Rating */}
      <div className="h-5 w-24 rounded bg-gray-200" />

      {/* Review */}
      <div className="mt-5 h-4 w-full rounded bg-gray-200" />
      <div className="mt-2 h-4 w-11/12 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />

      {/* Divider */}
      <div className="mt-6 border-t border-gray-100 pt-5">

        {/* Name */}
        <div className="h-5 w-32 rounded bg-gray-200" />

        {/* Customer text */}
        <div className="mt-2 h-3 w-24 rounded bg-gray-200" />
      </div>
    </div>
  );
};

export default TestimonialSkeleton;