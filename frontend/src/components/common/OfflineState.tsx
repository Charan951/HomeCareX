import React from "react";

interface OfflineStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const OfflineState: React.FC<OfflineStateProps> = ({
  title = "You're offline",
  message = "Please check your internet connection and try again.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-orange-200 bg-white p-8 text-center">
      
      {/* Offline Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-xl text-[#ff8a3d]">
        !
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-900">
        {title}
      </h2>

      {/* Message */}
      <p className="mt-2 max-w-md text-sm text-gray-500">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="
            mt-5
            rounded-md
            bg-[#ff8a3d]
            px-4
            py-2
            text-sm
            font-medium
            text-white
            transition
            hover:bg-[#4338ca]
          "
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default OfflineState;