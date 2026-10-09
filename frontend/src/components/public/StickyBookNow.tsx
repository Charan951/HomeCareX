import React from "react";
import { CalendarCheck } from "lucide-react";

interface StickyBookNowProps {
  serviceName: string;
  price: number;
  onBookNow: () => void;
  disabled?: boolean;
}

/**
 * Mobile / tablet: fixed bottom bar (hidden from lg up).
 * Desktop: the sticky booking card in ServiceDetails uses the same handler.
 */
const StickyBookNow: React.FC<StickyBookNowProps> = ({
  serviceName,
  price,
  onBookNow,
  disabled = false,
}) => {
  return (
    <div
      role="region"
      aria-label="Book this service"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e4e7f5] bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(17,16,79,0.10)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold text-[#11104f]">
            {serviceName}
          </p>
          <p className="mt-0.5 text-xs text-[#6b6b8a]">
            Starting at{" "}
            <span className="font-extrabold text-[#4338ca]">
              ₹{price.toLocaleString("en-IN")}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onBookNow}
          disabled={disabled}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4338ca] to-[#6d5dfc] px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#4338ca]/30 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4338ca]/30"
        >
          <CalendarCheck size={18} aria-hidden="true" />
          Book now
        </button>
      </div>
    </div>
  );
};

export default StickyBookNow;