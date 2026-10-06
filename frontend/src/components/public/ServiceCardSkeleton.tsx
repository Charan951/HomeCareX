import React from "react";

const ServiceCardSkeleton: React.FC = () => {
  return (
    <div
      className="
        overflow-hidden
        rounded-2xl
        border
        border-[#e0e7ff]
        bg-white
        shadow-sm
      "
      aria-hidden="true"
    >
      {/* Image Skeleton */}
      <div className="aspect-[4/3] animate-pulse bg-[#e5e7eb]" />

      {/* Content Skeleton */}
      <div className="space-y-4 p-5">

        {/* Service Name */}
        <div className="h-5 w-3/4 animate-pulse rounded bg-[#e5e7eb]" />

        {/* Price + Duration */}
        <div className="flex items-center justify-between">

          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-[#e5e7eb]" />
            <div className="h-5 w-16 animate-pulse rounded bg-[#e5e7eb]" />
          </div>

          <div className="space-y-2 text-right">
            <div className="ml-auto h-3 w-16 animate-pulse rounded bg-[#e5e7eb]" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-[#e5e7eb]" />
          </div>

        </div>

        {/* Button */}
        <div className="h-11 w-full animate-pulse rounded-xl bg-[#e5e7eb]" />

      </div>
    </div>
  );
};

export default ServiceCardSkeleton;