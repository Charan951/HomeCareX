import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';

export interface ResendTimerProps {
  onResend: () => Promise<boolean | void>;
  initialSeconds?: number;
  disabled?: boolean;
  isOffline?: boolean;
  className?: string;
}

export const ResendTimer: React.FC<ResendTimerProps> = ({
  onResend,
  initialSeconds = 30,
  disabled = false,
  isOffline = false,
  className = '',
}) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (secondsLeft > 0 || loading || disabled || isOffline) return;

    setLoading(true);
    try {
      const result = await onResend();
      // If callback returns false, it indicates failure; otherwise reset timer to initialSeconds
      if (result !== false) {
        setSecondsLeft(initialSeconds);
      }
    } finally {
      setLoading(false);
    }
  };

  const formattedTime = `00:${secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}`;
  const isCountingDown = secondsLeft > 0;

  return (
    <div className={`flex items-center justify-center text-xs sm:text-sm ${className}`}>
      {isCountingDown ? (
        <span className="text-gray-400 font-medium select-none" aria-live="polite">
          Resend code in <span className="font-semibold text-gray-600 tabular-nums">{formattedTime}</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || disabled || isOffline}
          className="inline-flex items-center gap-1.5 font-semibold text-brand-600 hover:text-brand-700
                     hover:underline focus:outline-none focus:ring-2 focus:ring-brand-500/40 rounded px-1.5 py-0.5
                     disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <RotateCw size={14} className="animate-spin text-brand-600" aria-hidden="true" />
              <span>Resending...</span>
            </>
          ) : (
            <span>Resend code</span>
          )}
        </button>
      )}
    </div>
  );
};

export default ResendTimer;
