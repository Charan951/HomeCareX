import { NavLink } from "react-router-dom";
import NavIcon from "./NavIcon";
import { CUSTOMER_NAV_ITEMS } from "./navItems";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex w-56 shrink-0 flex-col bg-panel border-r border-line h-screen sticky top-0">
      <div className="px-5 py-6">
        <div className="text-lg font-semibold tracking-tight text-brand">HomeCareX</div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {CUSTOMER_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors ${
                isActive ? "bg-brand-soft text-brand font-medium" : "text-muted hover:bg-canvas hover:text-ink"
              }`
            }
          >
            <NavIcon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
