import { useEffect, useState } from "react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { NO_SCROLLBAR } from "@/components/customer/noScrollbar";
import { prefersReducedMotion } from "../format";

export interface SectionLink {
  id: string;
  label: string;
}

/** Distance from the top of the screen to the bottom of the docked bar: TopBar (68) + bar (~68) + breathing room. */
const DOCK_OFFSET_PX = 140;

/**
 * In-page tabs, docked under the TopBar (64px, 68px from md). The nav sits on an opaque band in the page colour,
 * so content scrolls cleanly underneath instead of showing through the pill. The highlighted tab follows the
 * section currently under the docked bar.
 */
export default function SectionNav({ sections }: { sections: SectionLink[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const key = sections.map((s) => s.id).join(",");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const ids = key.split(",").filter(Boolean);
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: `-${DOCK_OFFSET_PX}px 0px -60% 0px` },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [key]);

  if (sections.length < 2) return null;

  const go = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  };

  return (
    <nav aria-label="Page sections" className="sticky top-68px] z-20 -mx-1 bg-canvas px-1 py-2 md:top-[0px]">
      <ul className={clsx("flex gap-1.3 overflow-x-auto rounded-full  bg-white p-1.5 ", NO_SCROLLBAR)}>
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <button
              type="button"
              onClick={() => go(s.id)}
              aria-current={active === s.id ? "true" : undefined}
              className={clsx(
                "min-h-[40px] rounded-full px-4 text-sm font-semibold transition-colors duration-200",
                active === s.id ? "bg-brand text-white" : "text-muted hover:bg-brand-soft hover:text-brand",
                FOCUS_RING,
              )}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
