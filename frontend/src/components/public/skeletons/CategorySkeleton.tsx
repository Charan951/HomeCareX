import React from "react";

const CategorySkeleton: React.FC = () => {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Image */}
      <div className="h-48 w-full bg-gray-200" />

      {/* Content */}
      <div className="p-5">
        {/* Category name */}
        <div className="h-6 w-3/4 rounded bg-gray-200" />

        {/* Description */}
        <div className="mt-3 h-4 w-full rounded bg-gray-200" />
        <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />

        {/* Service count */}
        <div className="mt-4 h-4 w-1/3 rounded bg-gray-200" />

        {/* Link */}
        <div className="mt-5 h-10 w-32 rounded-lg bg-gray-300" />
      </div>
    </div>
  );
};

export default CategorySkeleton;