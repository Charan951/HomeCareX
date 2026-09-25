import React, { useState } from "react";
import { NavLink } from "react-router-dom";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">

      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <NavLink to="/">
          <img
            src="/logo.png"
            alt="HomeCareX"
            className="h-16 w-auto"
          />
        </NavLink>


        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">

          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive
                ? "text-[#ff8a3d] font-bold transition"
                : "text-gray-700 hover:text-[#4338ca] transition"
            }
          >
            Home
          </NavLink>


          {/* Services */}
          <NavLink
            to="/services"
            className={({ isActive }) =>
              isActive
                ? "text-[#ff8a3d] font-bold transition"
                : "text-gray-700 hover:text-[#4338ca] transition"
            }
          >
            Services
          </NavLink>


          {/* About */}
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive
                ? "text-[#ff8a3d] font-bold transition"
                : "text-gray-700 hover:text-[#4338ca] transition"
            }
          >
            About
          </NavLink>


          {/* Contact */}
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive
                ? "text-[#ff8a3d] font-bold transition"
                : "text-gray-700 hover:text-[#4338ca] transition"
            }
          >
            Contact
          </NavLink>

        </nav>


        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">

          {/* Login */}
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive
                ? "text-[#ff8a3d] font-bold transition"
                : "text-[#4338ca] font-medium hover:text-[#ff8a3d] transition"
            }
          >
            Login
          </NavLink>


          {/* Register */}
          <NavLink
            to="/register"
            className={({ isActive }) =>
              isActive
                ? "bg-[#4338ca] text-white px-5 py-2.5 rounded-lg font-medium transition"
                : "bg-[#ff8a3d] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#4338ca] transition"
            }
          >
            Register
          </NavLink>

        </div>


        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-2xl text-[#4338ca]"
          aria-label="Toggle menu"
        >
          ☰
        </button>

      </div>


      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">

          <nav className="flex flex-col px-6 py-4 gap-4">

            {/* Mobile Home */}
            <NavLink
              to="/"
              end
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "text-[#ff8a3d] font-bold transition"
                  : "text-gray-700 hover:text-[#4338ca] transition"
              }
            >
              Home
            </NavLink>


            {/* Mobile Services */}
            <NavLink
              to="/services"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "text-[#ff8a3d] font-bold transition"
                  : "text-gray-700 hover:text-[#4338ca] transition"
              }
            >
              Services
            </NavLink>


            {/* Mobile About */}
            <NavLink
              to="/about"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "text-[#ff8a3d] font-bold transition"
                  : "text-gray-700 hover:text-[#4338ca] transition"
              }
            >
              About
            </NavLink>


            {/* Mobile Contact */}
            <NavLink
              to="/contact"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "text-[#ff8a3d] font-bold transition"
                  : "text-gray-700 hover:text-[#4338ca] transition"
              }
            >
              Contact
            </NavLink>


            <hr />


            {/* Mobile Login */}
            <NavLink
              to="/login"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "text-[#ff8a3d] font-bold transition"
                  : "text-[#4338ca] font-medium hover:text-[#ff8a3d] transition"
              }
            >
              Login
            </NavLink>


            {/* Mobile Register */}
            <NavLink
              to="/register"
              onClick={() => setIsMenuOpen(false)}
              className={({ isActive }) =>
                isActive
                  ? "bg-[#4338ca] text-white px-5 py-2.5 rounded-lg font-medium transition"
                  : "bg-[#ff8a3d] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#4338ca] transition"
              }
            >
              Register
            </NavLink>

          </nav>

        </div>
      )}

    </header>
  );
};

export default Header;