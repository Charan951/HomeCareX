import { NavLink } from "react-router-dom";
import NavIcon from "./NavIcon";
import { CUSTOMER_NAV_ITEMS } from "./navItems";

export default function BottomTabBar() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-panel border-t border-line flex z-20"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {CUSTOMER_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-2.5 text-xs transition-colors ${
              isActive ? "text-brand" : "text-muted"
            }`
          }
        >
          <NavIcon name={item.icon} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
