import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import MobileDrawer from "./MobileDrawer";

/* =========================================================
   STYLES (same design tokens as the other HomeCareX pages)
   Indigo #4338ca = structure and text, Orange #ff8a3d = action
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

.hcx-hd {
  font-family: 'DM Sans', system-ui, sans-serif;
}

@keyframes hd-drop {
  from {
    opacity: 0;
    transform: translateY(-14px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

.hd-drop {
  animation: hd-drop .7s cubic-bezier(.2,.7,.2,1) both;
}

/* =========================================================
   TOP INFO BAR
========================================================= */

.hd-topbar {
  display: grid;
  grid-template-rows: 1fr;
  transition: grid-template-rows .4s ease, opacity .3s ease;
}

.hd-topbar.is-collapsed {
  grid-template-rows: 0fr;
  opacity: 0;
}

.hd-topbar > div {
  overflow: hidden;
}

/* IMPORTANT:
   Hide the blue top information bar completely on mobile.
*/
@media (max-width: 767px) {
  .hd-topbar {
    display: none !important;
  }
}

/* Top bar links */
.hd-top-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #dfe1ff;
  transition: color .25s ease;
}

.hd-top-link:hover {
  color: #ffffff;
}

/* =========================================================
   NAVIGATION LINK
========================================================= */

.hd-link {
  position: relative;
  padding: 8px 2px;
  font-weight: 500;
  color: #3a3a5c;
  transition: color .3s ease;
}

.hd-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: #ff8a3d;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform .35s cubic-bezier(.2,.7,.2,1);
}

.hd-link:hover {
  color: #4338ca;
}

.hd-link:hover::after {
  transform: scaleX(1);
}

.hd-link.is-active {
  color: #4338ca;
  font-weight: 700;
}

.hd-link.is-active::after {
  transform: scaleX(1);
}

/* =========================================================
   LOGIN BUTTON
========================================================= */

.hd-cta {
  position: relative;
  overflow: hidden;
}

.hd-cta::before {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-120%) skewX(-20deg);
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.55),
    transparent
  );
  transition: transform .7s ease;
}

.hd-cta:hover::before {
  transform: translateX(120%) skewX(-20deg);
}

/* =========================================================
   HAMBURGER MENU
========================================================= */

.hd-bar {
  display: block;
  height: 2px;
  width: 22px;
  border-radius: 2px;
  background: #4338ca;
  transition: transform .35s ease, opacity .25s ease;
}

.hd-burger.open .hd-bar:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hd-burger.open .hd-bar:nth-child(2) {
  opacity: 0;
}

.hd-burger.open .hd-bar:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

/* =========================================================
   ACCESSIBILITY
========================================================= */

.hcx-hd a:focus-visible,
.hcx-hd button:focus-visible {
  outline: 3px solid #ff8a3d;
  outline-offset: 3px;
  border-radius: 10px;
}

.hd-top-link:focus-visible {
  outline-color: #ffffff;
}

/* =========================================================
   REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce) {
  .hcx-hd *,
  .hcx-hd *::before,
  .hcx-hd *::after {
    animation: none !important;
    transition: none !important;
  }
}
`;

/* ---------------------------------------------------------
   CONTACT DETAILS SHOWN IN THE TOP BAR
   These are placeholders. Replace them with your real details.
--------------------------------------------------------- */

const contact = {
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  email: "support@homecarex.com",
  hours: "Mon to Sat, 8 AM to 8 PM",
};

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services", end: false },
  { to: "/about", label: "About", end: true },
  { to: "/contact", label: "Contact", end: true },
];

const Header: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  const lastY = useRef(0);
  const { pathname } = useLocation();

  // Reference to the header itself
  const headerRef = useRef<HTMLElement>(null);

  const getLinkClass = (itemTo: string, end?: boolean) => {
    const currentPath = location.pathname;

    // Strict check: About is only active when on /about, never on /faq
    if (itemTo === "/about") {
      return `hd-link ${currentPath === "/about" ? "is-active" : ""}`;
    }

    if (itemTo === "/" || end) {
      return `hd-link ${currentPath === itemTo ? "is-active" : ""}`;
    }

    const isActive = currentPath === itemTo || currentPath.startsWith(`${itemTo}/`);
    return `hd-link ${isActive ? "is-active" : ""}`;
  };

  // Reference to the mobile menu button
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  /*
   * Publish the header's real height as the CSS variable --hcx-nav.
   * The home page hero uses it to be exactly one screen tall
   * (100vh minus header).
   */
  useEffect(() => {
    const el = headerRef.current;

    if (!el) return undefined;

    const publish = () => {
      if (window.scrollY > 8) return;

      document.documentElement.style.setProperty(
        "--hcx-nav",
        `${el.offsetHeight}px`
      );
    };

    publish();

    const ro = new ResizeObserver(publish);
    ro.observe(el);

    window.addEventListener("resize", publish);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", publish);

      document.documentElement.style.removeProperty("--hcx-nav");
    };
  }, []);

  // Compact + shadow after scrolling;
  // hide when scrolling down, show when scrolling up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;

      setScrolled(y > 8);

      if (y > 240 && y > lastY.current + 6) {
        setHidden(true);
      } else if (y < lastY.current - 6 || y <= 240) {
        setHidden(false);
      }

      lastY.current = y;
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close mobile menu when page changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Close mobile menu using Escape
  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [isMenuOpen]);

  const offscreen = hidden && !isMenuOpen;

  return (
    <header
      ref={headerRef}
      className={`hcx-hd sticky top-0 z-50 transition-transform duration-500 ${
        offscreen ? "-translate-y-full" : "translate-y-0"
      } ${
        scrolled
          ? "shadow-[0_12px_40px_-15px_rgba(67,56,202,0.35)]"
          : ""
      }`}
    >
      <style>{styles}</style>

      {/* =====================================================
          TOP INFO BAR
          DESKTOP ONLY
      ===================================================== */}

      <div
        className={`hd-topbar hidden md:grid ${
          scrolled ? "is-collapsed" : ""
        }`}
      >
        <div className="flex min-h-10 items-center justify-between bg-[#242064] px-6 text-xs">
          <span className="hidden items-center gap-2 text-[#dfe1ff] lg:inline-flex">
            {contact.hours}
          </span>
          <NavLink to="/register" className="hd-top-link font-medium">
            Are you a service professional?
            <span className="font-bold text-[#ff8a3d]">Join us</span>
          </NavLink>
        </div>
      </div>

      {/* =====================================================
          MAIN HEADER BAR
      ===================================================== */}

      <div
        className={`relative overflow-hidden backdrop-blur-xl transition-all duration-500 ${
          scrolled
            ? "bg-white/90"
            : "bg-gradient-to-r from-white via-[#eef0ff] to-white"
        }`}
      >

        {/* Soft colour glow - left */}
        <div
          className={`pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#4338ca]/15 blur-3xl transition-opacity duration-500 ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden
        />

        {/* Soft colour glow - right */}
        <div
          className={`pointer-events-none absolute -bottom-28 -right-20 h-56 w-56 rounded-full bg-[#ff8a3d]/20 blur-3xl transition-opacity duration-500 ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden
        />

        {/* Bottom edge */}
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#4338ca]/40 to-transparent"
          aria-hidden
        />

        {/* =================================================
            HEADER CONTAINER
        ================================================= */}

        <div
          className={`hd-drop relative mx-auto grid max-w-7xl grid-cols-[auto_1fr] items-center px-6 transition-all duration-300 md:grid-cols-[1fr_auto_1fr] ${
            scrolled ? "py-2" : "py-3"
          }`}
        >

          {/* Logo */}
          <NavLink
            to="/"
            onClick={closeMenu}
            aria-label="HomeCareX Home"
            className="flex-shrink-0 justify-self-start"
          >
            <img
              src="/logo.png"
              alt="HomeCareX"
              className={`w-auto transition-all duration-300 hover:scale-105 ${
                scrolled ? "h-11" : "h-14"
              }`}
            />
          </NavLink>

          {/* Desktop Navigation */}
          <nav
            className="hidden items-center gap-9 rounded-full bg-white/70 px-9 py-1.5 ring-1 ring-[#4338ca]/10 backdrop-blur md:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={() => getLinkClass(item.to, item.end)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Login */}
          <div className="hidden justify-self-end md:block">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `hd-cta group inline-flex items-center gap-2 rounded-xl px-7 py-2.5 font-bold transition duration-300 hover:-translate-y-0.5 ${
                  isActive
                    ? "bg-[#4338ca] text-white shadow-[0_10px_25px_-10px_rgba(67,56,202,0.8)]"
                    : "bg-[#ff8a3d] text-[#1b1b3a] shadow-[0_10px_25px_-10px_rgba(255,138,61,0.9)] hover:bg-[#ff7a22]"
                }`
              }
            >
              Login

              <span
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              >
                →
              </span>
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`hd-burger flex h-11 w-11 flex-col items-center justify-center gap-[5px] justify-self-end rounded-xl transition-colors duration-300 hover:bg-[#eef0ff] md:hidden ${
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
      </div>

      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}

      <div id="mobile-navigation">
        <MobileDrawer
          isOpen={isMenuOpen}
          onClose={closeMenu}
          menuButtonRef={menuButtonRef}
        />
      </div>

    </header>
  );
};

export default Header;