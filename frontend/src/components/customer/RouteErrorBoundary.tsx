import { Component, type ReactNode } from "react";
import { ErrorState } from "./StateViews";

interface Props {
  children: ReactNode;
  /** Change this (e.g. the pathname) to clear a previous error when the user navigates. */
  resetKey?: string;
}

interface State {
  error: Error | null;
}

/** Catches render errors in a page so the layout stays visible instead of a blank screen. */
export default class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(): void {
    // Hook for Sentry (TRD §16) — intentionally no console logging.
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render(): ReactNode {
    if (this.state.error) {
      return <ErrorState onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}