import React from "react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "We couldn't load the requested information. Please try again.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-white p-8 text-center">
      
      {/* Error Icon */}
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
        !
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold text-gray-900">
        {title}
      </h2>

      {/* Error Message */}
      <p className="mt-2 max-w-md text-sm text-gray-500">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-md bg-brand-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-600"
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorState;