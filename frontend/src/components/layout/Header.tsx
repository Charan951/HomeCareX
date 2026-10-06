import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Clock, Mail, Phone } from "lucide-react";
import MobileDrawer from "./MobileDrawer";

/* =========================================================
   HomeCareX Header
   Brand Colors:
   Indigo: #4338ca
   Orange: #ff8a3d
========================================================= */

const styles = `
  .hcx-hd {
    font-family:
      "DM Sans",
      Inter,
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }

  @keyframes hcx-header-drop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }

    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .hcx-header-drop {
    animation: hcx-header-drop 0.5s cubic-bezier(.2,.7,.2,1) both;
  }

  /* TOP BAR */

  .hcx-topbar {
    display: grid;
    grid-template-rows: 1fr;
    opacity: 1;
    transition:
      grid-template-rows 0.35s ease,
      opacity 0.25s ease;
  }

  .hcx-topbar.collapsed {
    grid-template-rows: 0fr;
    opacity: 0;
  }

  .hcx-topbar > div {
    overflow: hidden;
    min-height: 0;
  }

  .hcx-top-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: #dfe1ff;
    transition: color 0.2s ease;
  }

  .hcx-top-link:hover {
    color: #ffffff;
  }

  /* DESKTOP NAVIGATION */

  .hcx-nav-link {
    position: relative;
    padding: 9px 2px;
    font-weight: 600;
    color: #3a3a5c;
    transition:
      color 0.25s ease,
      transform 0.25s ease;
  }

  .hcx-nav-link::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 2px;
    height: 2px;
    border-radius: 999px;
    background: #ff8a3d;
    transform: scaleX(0);
    transform-origin: center;
    transition: transform 0.25s ease;
  }

  .hcx-nav-link:hover {
    color: #4338ca;
  }

  .hcx-nav-link:hover::after,
  .hcx-nav-link.active::after {
    transform: scaleX(1);
  }

  .hcx-nav-link.active {
    color: #4338ca;
    font-weight: 700;
  }

  /* LOGIN BUTTON */

  .hcx-login {
    position: relative;
    overflow: hidden;
  }

  .hcx-login::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.45),
      transparent
    );
    transform: translateX(-120%) skewX(-20deg);
    transition: transform 0.65s ease;
  }

  .hcx-login:hover::before {
    transform: translateX(120%) skewX(-20deg);
  }

  /* MOBILE HAMBURGER */

  .hcx-menu-bar {
    display: block;
    width: 22px;
    height: 2px;
    border-radius: 999px;
    background: #4338ca;
    transition:
      transform 0.3s ease,
      opacity 0.2s ease;
  }

  .hcx-menu.open .hcx-menu-bar:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .hcx-menu.open .hcx-menu-bar:nth-child(2) {
    opacity: 0;
  }

  .hcx-menu.open .hcx-menu-bar:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  /* ACCESSIBILITY */

  .hcx-hd a:focus-visible,
  .hcx-hd button:focus-visible {
    outline: 3px solid #ff8a3d;
    outline-offset: 3px;
    border-radius: 10px;
  }

  .hcx-top-link:focus-visible {
    outline-color: #ffffff;
  }

  /* REDUCED MOTION */

  @media (prefers-reduced-motion: reduce) {
    .hcx-hd *,
    .hcx-hd *::before,
    .hcx-hd *::after {
      animation: none !important;
      transition: none !important;
    }
  }

  /* MOBILE */

  @media (max-width: 767px) {
    .hcx-topbar {
      display: none !important;
    }
  }
`;

/* =========================================================
   CONTACT INFORMATION
========================================================= */

const contact = {
  phone: "+91 98765 43210",
  phoneHref: "tel:+919876543210",
  email: "support@homecarex.com",
  hours: "Mon to Sat, 8 AM to 8 PM",
};

/* =========================================================
   NAVIGATION
========================================================= */

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/services", label: "Services", end: false },
  { to: "/about", label: "About", end: true },
  { to: "/contact", label: "Contact", end: true },
];

/* =========================================================
   HEADER COMPONENT
========================================================= */

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  /* HEADER HEIGHT */

  useEffect(() => {
    const element = headerRef.current;

    if (!element) {
      return undefined;
    }

    const publishHeaderHeight = () => {
      if (window.scrollY > 8) {
        return;
      }

      document.documentElement.style.setProperty(
        "--hcx-nav",
        `${element.offsetHeight}px`
      );
    };

    publishHeaderHeight();

    const resizeObserver = new ResizeObserver(publishHeaderHeight);
    resizeObserver.observe(element);

    window.addEventListener("resize", publishHeaderHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", publishHeaderHeight);
      document.documentElement.style.removeProperty("--hcx-nav");
    };
  }, []);

  /* SCROLL BEHAVIOR
     Header always stays visible. Only the compact style
     (smaller padding, collapsed top bar, shadow) changes. */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* CLOSE MENU WHEN ROUTE CHANGES */

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  /* ESCAPE KEY */

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={`hcx-hd sticky top-0 z-50 transition-shadow duration-500 ${
        scrolled ? "shadow-[0_12px_40px_-15px_rgba(67,56,202,0.30)]" : ""
      }`}
    >
      <style>{styles}</style>

      {/* TOP INFORMATION BAR */}

      <div
        className={`hcx-topbar hidden md:grid ${scrolled ? "collapsed" : ""}`}
      >
        <div>
        <div className="flex min-h-10 items-center justify-between bg-[#242064] px-6 text-xs">
          <div className="hidden items-center gap-5 lg:inline-flex">
            <span className="inline-flex items-center gap-2 text-[#dfe1ff]">
              <Clock size={14} aria-hidden="true" />
              {contact.hours}
            </span>
            <a href={contact.phoneHref} className="hcx-top-link">
              <Phone size={14} aria-hidden="true" />
              {contact.phone}
            </a>
            <a href={`mailto:${contact.email}`} className="hcx-top-link">
              <Mail size={14} aria-hidden="true" />
              {contact.email}
            </a>
          </div>

          <NavLink
            to="/contact#partner-interest"
            className="hcx-top-link ml-auto font-medium"
          >
            Are you a service professional?
            <span className="font-bold text-[#ff8a3d]">Join us</span>
          </NavLink>
        </div>
        </div>
      </div>

      {/* MAIN HEADER */}

      <div
        className={`relative overflow-hidden backdrop-blur-xl transition-all duration-500 ${
          scrolled
            ? "bg-white/95"
            : "bg-gradient-to-r from-white via-[#eef0ff] to-white"
        }`}
      >
        {/* Indigo decorative glow */}
        <div
          className={`pointer-events-none absolute -left-24 -top-24 h-56 w-56 rounded-full bg-[#4338ca]/15 blur-3xl transition-opacity duration-500 ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden="true"
        />

        {/* Orange decorative glow */}
        <div
          className={`pointer-events-none absolute -bottom-28 -right-20 h-56 w-56 rounded-full bg-[#ff8a3d]/20 blur-3xl transition-opacity duration-500 ${
            scrolled ? "opacity-0" : "opacity-100"
          }`}
          aria-hidden="true"
        />

        {/* Bottom border */}
        <div
          className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#4338ca]/30 to-transparent"
          aria-hidden="true"
        />

        {/* NOTE: "hcx-header-drop" is intentionally NOT on this wrapper.
            An animated transform/opacity here would isolate the logo and
            stop mix-blend-multiply from removing its white background. */}
        <div
          className={`relative mx-auto grid max-w-7xl grid-cols-[auto_1fr] items-center px-5 sm:px-6 md:grid-cols-[1fr_auto_1fr] ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
          {/* LOGO */}
          <NavLink
            to="/"
            onClick={closeMenu}
            aria-label="HomeCareX Home"
            className="flex items-center justify-self-start rounded-xl"
          >
            <img
              src="/logo.png"
              alt="HomeCareX"
              className="h-14 w-auto object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105 sm:h-16"
            />
          </NavLink>

          {/* DESKTOP NAVIGATION */}
          <nav
            className="hcx-header-drop hidden items-center gap-8 rounded-full bg-white/75 px-8 py-2 shadow-sm ring-1 ring-[#4338ca]/10 backdrop-blur-md md:flex"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `hcx-nav-link${isActive ? " active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* LOGIN BUTTON */}
          <div className="hcx-header-drop hidden justify-self-end md:block">
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `hcx-login group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition duration-300 hover:-translate-y-0.5 ${
                  isActive
                    ? "bg-[#4338ca] text-white shadow-[0_10px_25px_-10px_rgba(67,56,202,0.8)]"
                    : "bg-[#ff8a3d] text-[#1b1b3a] shadow-[0_10px_25px_-10px_rgba(255,138,61,0.8)] hover:bg-[#f97829]"
                }`
              }
            >
              <span className="relative z-10">Login</span>
              <span
                className="relative z-10 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </NavLink>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((previous) => !previous)}
            className={`hcx-menu flex h-11 w-11 flex-col items-center justify-center gap-[5px] justify-self-end rounded-xl transition-colors duration-300 hover:bg-[#eef0ff] md:hidden ${
              isMenuOpen ? "open bg-[#eef0ff]" : ""
            }`}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="hcx-menu-bar" />
            <span className="hcx-menu-bar" />
            <span className="hcx-menu-bar" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}

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