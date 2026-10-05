import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Change this (e.g. the pathname) to clear the error after the partner navigates away. */
  resetKey?: string;
}
interface State {
  error: Error | null;
}

export default class PartnerErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Partner] render error", error, info.componentStack); // TODO: report to Sentry
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="mx-auto mt-10 max-w-md rounded border border-line bg-panel p-6 text-center">
        <h2 className="text-lg font-semibold text-brand">This page hit a problem</h2>
        <p className="mt-2 text-sm text-muted">Reload the page, or go back to Home.</p>
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="rounded bg-brand px-4 py-2 text-sm font-medium text-white">
            Reload page
          </button>
          <a href="/partner" className="rounded border border-line px-4 py-2 text-sm font-medium text-ink">
            Go to Home
          </a>
        </div>
      </div>
    );
  }
}