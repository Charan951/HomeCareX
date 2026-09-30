import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import MobileDrawer from "./MobileDrawer";

/* =========================================================
   STYLES (same design tokens as the other HomeCareX pages)
   Indigo #4338ca = structure and text, Orange #ff8a3d = action
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

.hcx-hd { font-family: 'DM Sans', system-ui, sans-serif; }

@keyframes hd-drop { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: none; } }
.hd-drop { animation: hd-drop .7s cubic-bezier(.2,.7,.2,1) both; }

/* Nav link with an underline that grows from the left */
.hd-link { position: relative; padding: 6px 2px; font-weight: 500; color: #3a3a5c; transition: color .3s ease; }
.hd-link::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -2px; height: 2px; border-radius: 2px;
  background: #ff8a3d; transform: scaleX(0); transform-origin: left;
  transition: transform .35s cubic-bezier(.2,.7,.2,1);
}
.hd-link:hover { color: #4338ca; }
.hd-link:hover::after { transform: scaleX(1); }
.hd-link.is-active { color: #4338ca; font-weight: 700; }
.hd-link.is-active::after { transform: scaleX(1); }

/* Hamburger that morphs into a cross */
.hd-bar { display: block; height: 2px; width: 22px; border-radius: 2px; background: #4338ca; transition: transform .35s ease, opacity .25s ease; }
.hd-burger.open .hd-bar:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hd-burger.open .hd-bar:nth-child(2) { opacity: 0; }
.hd-burger.open .hd-bar:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

.hcx-hd a:focus-visible, .hcx-hd button:focus-visible { outline: 3px solid #ff8a3d; outline-offset: 3px; border-radius: 10px; }

@media (prefers-reduced-motion: reduce) {
  .hcx-hd *, .hcx-hd *::before, .hcx-hd *::after { animation: none !important; transition: none !important; }
}
`;

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services", end: false },
  { to: "/about", label: "About", end: false },
  { to: "/contact", label: "Contact", end: false },
];

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  `hd-link ${isActive ? "is-active" : ""}`;

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Reference to the mobile menu button
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Compact the header and add a shadow once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`hcx-hd hd-drop sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? "border-[#4338ca]/10 bg-white/90 shadow-[0_8px_30px_-12px_rgba(67,56,202,0.25)]"
          : "border-gray-200 bg-white"
      }`}
    >
      <style>{styles}</style>

      {/* Header Container */}
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 ${
          scrolled ? "py-2" : "py-4"
        }`}
      >
        {/* Logo */}
        <NavLink to="/" onClick={closeMenu} aria-label="HomeCareX Home" className="flex-shrink-0">
          <img
            src="/logo.png"
            alt="HomeCareX"
            className={`w-auto transition-all duration-300 hover:scale-105 ${scrolled ? "h-12" : "h-16"}`}
          />
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-9 md:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Login / Register */}
        <div className="hidden items-center gap-3 md:flex">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `rounded-lg px-4 py-2.5 font-bold transition duration-300 ${
                isActive ? "bg-[#eef0ff] text-[#4338ca]" : "text-[#4338ca] hover:bg-[#eef0ff]"
              }`
            }
          >
            Login
          </NavLink>

          <NavLink
            to="/register"
            className={({ isActive }) =>
              `rounded-xl px-6 py-2.5 font-bold transition duration-300 hover:-translate-y-0.5 ${
                isActive
                  ? "bg-[#4338ca] text-white shadow-[0_10px_25px_-10px_rgba(67,56,202,0.8)]"
                  : "bg-[#ff8a3d] text-[#1b1b3a] shadow-[0_10px_25px_-10px_rgba(255,138,61,0.9)] hover:bg-[#ff7a22]"
              }`
            }
          >
            Register
          </NavLink>
        </div>

        {/* Mobile Menu Button */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className={`hd-burger flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-xl transition-colors duration-300 hover:bg-[#eef0ff] md:hidden ${
            isMenuOpen ? "open bg-[#eef0ff]" : ""
          }`}
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          <span className="hd-bar" />
          <span className="hd-bar" />
          <span className="hd-bar" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <div id="mobile-navigation">
        <MobileDrawer isOpen={isMenuOpen} onClose={closeMenu} menuButtonRef={menuButtonRef} />
      </div>
    </header>
  );
};

export default Header;