import React from "react";

interface PageLoaderProps {
  message?: string;
}

const PageLoader: React.FC<PageLoaderProps> = ({
  message = "Loading...",
}) => {
  return (
    <div
      className="flex min-h-[300px] flex-col items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Spinner */}
      <div
        className="
          h-10
          w-10
          animate-spin
          rounded-full
          border-4
          border-gray-200
          border-t-[#ff8a3d]
        "
      />

      {/* Loading Message */}
      <p className="mt-4 text-sm font-medium text-gray-600">
        {message}
      </p>
    </div>
  );
};

export default PageLoader;