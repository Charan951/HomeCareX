import React, { useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import MobileDrawer from "./MobileDrawer";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Reference to the mobile menu button
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">

      {/* Header Container */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <NavLink
          to="/"
          onClick={closeMenu}
          aria-label="HomeCareX Home"
        >
          <img
            src="/logo.png"
            alt="HomeCareX"
            className="h-16 w-auto"
          />
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">

          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "font-bold text-[#ff8a3d] transition"
                : "text-gray-700 transition hover:text-[#4338ca]"
            }
          >
            Home
          </NavLink>

          {/* Services */}
          <NavLink
            to="/services"
            className={({ isActive }) =>
              isActive
                ? "font-bold text-[#ff8a3d] transition"
                : "text-gray-700 transition hover:text-[#4338ca]"
            }
          >
            Services
          </NavLink>

          {/* About */}
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive
                ? "font-bold text-[#ff8a3d] transition"
                : "text-gray-700 transition hover:text-[#4338ca]"
            }
          >
            About
          </NavLink>

          {/* Contact */}
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive
                ? "font-bold text-[#ff8a3d] transition"
                : "text-gray-700 transition hover:text-[#4338ca]"
            }
          >
            Contact
          </NavLink>

        </nav>

        {/* Desktop Login / Register */}
        <div className="hidden items-center gap-4 md:flex">

          {/* Login */}
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive
                ? "font-bold text-[#ff8a3d] transition"
                : "font-medium text-[#4338ca] transition hover:text-[#ff8a3d]"
            }
          >
            Login
          </NavLink>

          {/* Register */}
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive
                ? "rounded-lg bg-[#4338ca] px-5 py-2.5 font-medium text-white transition"
                : "rounded-lg bg-[#ff8a3d] px-5 py-2.5 font-medium text-white transition hover:bg-[#4338ca]"
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
          className="rounded-md p-2 text-2xl text-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#ff8a3d] md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? "✕" : "☰"}
        </button>

      </div>

      {/* Mobile Drawer */}
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