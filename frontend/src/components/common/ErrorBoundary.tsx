import React from "react";

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
    console.error("Application Error:", error);
    console.error("Error Info:", errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#4338ca]">
              Something went wrong
            </h1>

            <p className="mt-3 text-gray-600">
              We couldn't load this page. Please try again.
            </p>

            <button
              onClick={this.handleRetry}
              className="mt-6 rounded-lg bg-[#ff8a3d] px-6 py-3 font-semibold text-white transition hover:bg-[#4338ca]"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;