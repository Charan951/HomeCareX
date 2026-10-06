import clsx from "clsx";
import type { CatalogCategory } from "@/types/catalog";
import { CategoryCard } from "./CategoryCard";

/** A 2x2 lead tile only when the remaining tiles fill 4-column rows exactly (5, 9, 13...). */
export const hasLeadTile = (n: number) => n >= 5 && (n - 1) % 4 === 0;

/** Shared by the grid and its skeleton so nothing jumps when data arrives. */
export const categoryGridClass = (lead: boolean) =>
  clsx(
    "grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 md:auto-rows-[190px] md:gap-4 lg:auto-rows-[210px]",
    lead ? "lg:grid-cols-4" : "lg:grid-cols-3",
  );

/**
 * Equal-size photo tiles (3 per row on wide screens). With 5, 9, 13... categories the first one
 * becomes a 2x2 lead tile. Tiles are never stretched into long strips, so photos are not over-cropped.
 */
export function CategoryGrid({ categories }: { categories: CatalogCategory[] }) {
  const n = categories.length;
  const lead = hasLeadTile(n);
  return (
    <ul className={categoryGridClass(lead)}>
      {categories.map((c, i) => {
        const featured = lead && i === 0;
        return (
          // On 2-column screens an odd last tile fills the row; on 3+ columns it stays one tile wide.
          <li key={c.id} className={clsx(featured && "col-span-2 lg:row-span-2", !lead && n % 2 === 1 && i === n - 1 && "col-span-2 lg:col-span-1")}>
            <CategoryCard category={c} index={i} featured={featured} />
          </li>
        );
      })}
    </ul>
  );
}
