import { useEffect, useState } from "react";
import { matchPath, NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { SIDEBAR_GROUPS, type CustomerNavGroup } from "./customerNav";
import { FOCUS_RING } from "./focusRing";

interface SidebarNavProps {
  /** Unique prefix so ids stay unique when the nav is rendered twice (sidebar + drawer). */
  idPrefix: string;
  /** Called after a link is chosen — the mobile drawer uses it to close itself. */
  onNavigate?: () => void;
}

/** Heading of the group that contains the current page (falls back to the first group). */
function activeGroupHeading(groups: CustomerNavGroup[], pathname: string): string {
  const match = groups.find((g) => g.items.some((i) => matchPath({ path: i.to, end: Boolean(i.end) }, pathname)));
  return (match ?? groups[0]).heading;
}

/**
 * The grouped customer links, shared by the desktop Sidebar and the mobile drawer.
 * Each group heading is a toggle: click Home / Bookings / Account / Support to show
 * or hide its links. The group holding the current page opens by itself (on load and
 * whenever you navigate), the others start collapsed and toggle independently.
 */
export default function SidebarNav({ idPrefix, onNavigate }: SidebarNavProps) {
  const { pathname } = useLocation();
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set([activeGroupHeading(SIDEBAR_GROUPS, pathname)]));

  // Navigating (even via a link elsewhere on the page) opens the group of the new page.
  useEffect(() => {
    const heading = activeGroupHeading(SIDEBAR_GROUPS, pathname);
    setOpenGroups((prev) => (prev.has(heading) ? prev : new Set(prev).add(heading)));
  }, [pathname]);

  function toggle(heading: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(heading)) next.delete(heading);
      else next.add(heading);
      return next;
    });
  }

  return (
    <nav aria-label="Main" className="space-y-1 px-3 pb-6">
      {SIDEBAR_GROUPS.map((group) => {
        const key = group.heading.toLowerCase();
        const buttonId = `${idPrefix}-${key}`;
        const listId = `${idPrefix}-${key}-list`;
        const open = openGroups.has(group.heading);

        return (
          <div key={group.heading}>
            <button
              type="button"
              id={buttonId}
              aria-expanded={open}
              aria-controls={listId}
              onClick={() => toggle(group.heading)}
              className={clsx(
                "flex min-h-[40px] w-full items-center justify-between rounded px-3 text-[11px] font-semibold uppercase tracking-wider text-muted transition-colors hover:bg-canvas hover:text-ink",
                FOCUS_RING,
              )}
            >
              {group.heading}
              <ChevronDown
                aria-hidden="true"
                className={clsx("h-4 w-4 transition-transform duration-200", open && "rotate-180")}
              />
            </button>

            {/* grid-rows 0fr -> 1fr animates the height; `invisible` keeps collapsed links out of Tab order */}
            <div
              className={clsx(
                "grid transition-[grid-template-rows,visibility] duration-200 ease-out",
                open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]",
              )}
            >
              <ul id={listId} aria-labelledby={buttonId} className="min-h-0 space-y-0.5 overflow-hidden">
                {group.items.map(({ label, to, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        clsx(
                          "flex min-h-[44px] items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors",
                          FOCUS_RING,
                          isActive ? "bg-brand-soft font-medium text-brand" : "text-muted hover:bg-canvas hover:text-ink",
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
