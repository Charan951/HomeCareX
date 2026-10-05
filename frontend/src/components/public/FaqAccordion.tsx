import React from "react";
import type { FAQItem } from "../../content/faq";

export interface FaqAccordionProps {
  items: FAQItem[];
  openIds?: string[];
  onToggle?: (id: string) => void;
  searchQuery?: string;
  className?: string;
}

/** Highlights matching keyword terms inside text */
const HighlightMatch: React.FC<{ text: string; query?: string }> = ({ text, query }) => {
  const trimmed = query?.trim();
  if (!trimmed) {
    return <>{text}</>;
  }

  // Escape special regex characters
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark
            key={index}
            className="rounded bg-[#ffe4d1] px-1 font-semibold text-[#1e1b6e]"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export const FaqAccordion: React.FC<FaqAccordionProps> = ({
  items,
  openIds,
  onToggle,
  searchQuery,
  className = "",
}) => {
  // Support either controlled open state or internal fallback state
  const [internalOpenIds, setInternalOpenIds] = React.useState<string[]>([]);
  const isControlled = openIds !== undefined;
  const currentOpenIds = isControlled ? openIds : internalOpenIds;

  const handleToggle = (id: string) => {
    if (onToggle) {
      onToggle(id);
    }
    if (!isControlled) {
      setInternalOpenIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  if (!items.length) {
    return null;
  }

  return (
    <div className={`space-y-2.5 sm:space-y-3 ${className}`} role="presentation">
      {items.map((item) => {
        const isOpen = currentOpenIds.includes(item.id);
        const btnId = `faq-btn-${item.id}`;
        const panelId = `faq-panel-${item.id}`;

        return (
          <div
            key={item.id}
            className={`rounded-2xl bg-white transition duration-200 ${
              isOpen
                ? "shadow-md ring-2 ring-[#4338ca]/30"
                : "shadow-xs ring-1 ring-[#4338ca]/10 hover:ring-[#4338ca]/25"
            }`}
          >
            <h3 className="m-0 p-0 text-base font-normal">
              <button
                type="button"
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => handleToggle(item.id)}
                className="group flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] sm:px-5 sm:py-4"
              >
                <span className="text-sm font-bold text-[#1e1b6e] transition-colors group-hover:text-[#4338ca] sm:text-base">
                  <HighlightMatch text={item.question} query={searchQuery} />
                </span>
                <span
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-base font-bold transition duration-300 sm:h-8 sm:w-8 sm:text-lg ${
                    isOpen
                      ? "rotate-45 bg-[#ff8a3d] text-white shadow-xs"
                      : "bg-[#ff8a3d]/15 text-[#e06a12] group-hover:bg-[#ff8a3d]/25"
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              aria-hidden={!isOpen}
              className={`hcx-acc ${isOpen ? "open" : ""}`}
            >
              <div>
                <p className="px-4 pb-4 text-xs leading-relaxed text-[#5b5b7a] sm:px-5 sm:pb-4.5 sm:text-sm sm:leading-6">
                  <HighlightMatch text={item.answer} query={searchQuery} />
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
