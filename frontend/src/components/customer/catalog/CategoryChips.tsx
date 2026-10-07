import clsx from "clsx";
import { Icon3D, categoryVisual } from "@/pages/customer/Shared/visuals";
import type { CatalogCategory } from "@/types/catalog";
import { FOCUS_RING } from "../focusRing";
import { plural } from "./format";

interface Props {
  categories: CatalogCategory[];
  /** Total services, shown on the "All" chip. */
  total: number;
  /** Selected category slug; undefined means "All". */
  selected: string | undefined;
  onSelect: (slug: string | undefined) => void;
}

/** One-tap category switcher with a photo thumbnail. Scrolls sideways on small screens. */
export function CategoryChips({ categories, total, selected, onSelect }: Props) {
  const base = "group flex shrink-0 snap-start items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 text-left transition-all duration-200";
  const state = (on: boolean) => (on ? "border-brand bg-brand-soft shadow-[inset_0_0_0_1px_#4338CA]" : "border-line bg-panel hover:border-brand/30 hover:shadow-sm");
  return (
    <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 py-1 md:mx-0 md:scroll-px-0 md:px-0">
      <button type="button" aria-pressed={!selected} onClick={() => onSelect(undefined)} className={clsx(base, state(!selected), FOCUS_RING)}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-base text-brand shadow-sm" aria-hidden="true">✦</span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-tight text-ink">All</span>
          <span className="block text-[10.5px] leading-tight text-muted">{plural(total, "service")}</span>
        </span>
      </button>
      {categories.map((c, i) => {
        const v = categoryVisual(c.slug);
        const on = c.slug === selected;
        return (
          <button key={c.id} type="button" aria-pressed={on} onClick={() => onSelect(on ? undefined : c.slug)} className={clsx(base, state(on), FOCUS_RING)}>
            <span className={clsx("relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full", v.tint)}>
              {v.image ? (
                <img src={v.image} alt="" loading="lazy" decoding="async" style={{ objectPosition: v.focus }} className="h-full w-full object-cover" />
              ) : (
                <Icon3D asset={v.asset} emoji={c.icon} delayMs={i * 500} className="h-6 w-6" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block max-w-[150px] truncate text-[13px] font-semibold leading-tight text-ink">{c.name}</span>
              <span className="block text-[10.5px] leading-tight text-muted">{plural(c.serviceCount, "service")}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
