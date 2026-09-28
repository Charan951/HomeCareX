import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <div>
          <img
            src="/logo.png"
            alt="HomeCareX"
            className="h-12 w-auto"
          />
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="/" className="text-gray-700 hover:text-brand-600">
            Home
          </a>

          <a href="/services" className="text-gray-700 hover:text-brand-600">
            Services
          </a>

          <a href="/about" className="text-gray-700 hover:text-brand-600">
            About
          </a>

          <a href="/contact" className="text-gray-700 hover:text-brand-600">
            Contact
          </a>
        </nav>

        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-4">
         <Link to="/login" className="text-brand-600 font-medium">Login</Link>

          <Link to="/register" className="bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700">
            Register
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-2xl text-gray-700"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile Drawer */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">

          <nav className="flex flex-col px-6 py-4 gap-4">

            <a
              href="/"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700"
            >
              Home
            </a>

            <a
              href="/services"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700"
            >
              Services
            </a>

            <a
              href="/about"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700"
            >
              About
            </a>

            <a
              href="/contact"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-700"
            >
              Contact
            </a>

            <hr />

           <Link to="/login" className="text-brand-600 font-medium">Login</Link>

            <Link to="/register" className="bg-brand-600 text-white px-5 py-2.5 rounded-lg hover:bg-brand-700">
              Register
            </Link>

          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;