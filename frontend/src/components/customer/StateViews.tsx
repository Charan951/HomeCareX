import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, Loader2, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { FOCUS_RING } from "./focusRing";

/** Shared loading / empty / error / offline states so no customer screen is ever blank. */

interface LoadingStateProps {
  label?: string;
  fullScreen?: boolean;
}

export function LoadingState({ label = "Loading…", fullScreen = false }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 text-muted ${fullScreen ? "min-h-screen" : "py-16"}`}
    >
      <Loader2 className="h-6 w-6 animate-spin text-brand" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded border border-dashed border-line bg-panel px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-muted" aria-hidden="true" />
      <p className="font-medium text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again. If the problem continues, contact support.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 rounded border border-line bg-panel px-6 py-12 text-center">
      <AlertTriangle className="h-8 w-8 text-danger" aria-hidden="true" />
      <p className="font-medium text-ink">{title}</p>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`mt-2 min-h-[44px] rounded bg-brand px-4 text-sm font-medium text-white hover:opacity-90 ${FOCUS_RING}`}
        >
          Try again
        </button>
      )}
    </div>
  );
}

/** Slim banner shown under the top bar while the browser is offline. */
export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div role="status" className="flex items-center justify-center gap-2 bg-accent-soft px-4 py-2 text-sm text-ink">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      You're offline. Some information may be out of date.
    </div>
  );
}
