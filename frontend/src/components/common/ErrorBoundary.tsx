import React from "react";
import OfflineState from "./OfflineState";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    } else {
      console.error("ErrorBoundary caught an error:", error?.name || "Error");
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
    });
  };

  handleGoHome = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

      if (isOffline) {
        return (
          <div className="flex min-h-[50vh] items-center justify-center px-6 py-12">
            <OfflineState
              title="You're offline"
              message="Please check your internet connection and try again."
              onRetry={() => {
                this.handleRetry();
                window.location.reload();
              }}
            />
          </div>
        );
      }

      return (
        <main
          className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12"
          role="alert"
          aria-labelledby="error-boundary-heading"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg ring-1 ring-gray-900/5 sm:p-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-2xl text-red-600 ring-8 ring-red-50/50">
              ⚠️
            </div>

            <h1
              id="error-boundary-heading"
              className="mt-6 text-2xl font-bold tracking-tight text-[#1e1b6e] sm:text-3xl"
            >
              Something went wrong. Please try again.
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              An unexpected error occurred while loading this page. You can try again or return to the home page.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center rounded-xl bg-[#ff8a3d] px-6 py-3 font-semibold text-[#1b1b3a] shadow-sm transition hover:bg-[#ff7a22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff8a3d]"
              >
                Try Again
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4338ca]"
              >
                Go Home
              </button>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;