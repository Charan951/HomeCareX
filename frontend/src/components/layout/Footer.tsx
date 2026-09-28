import React from "react";
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-[#2D1B69] text-white">
      <div className="mx-auto max-w-7xl px-6 py-7">

        {/* ================= FOOTER CONTENT ================= */}
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">

          {/* ================= BRAND ================= */}
          <div className="lg:col-span-2">

            <h2 className="text-2xl font-bold">
              HOME
              <span className="text-[#ff8a3d]">CARE</span>
              X
            </h2>

            <p className="mt-2 text-sm text-gray-300">
              Your Home, Our Care
            </p>

            <p className="mt-2 max-w-xs text-sm leading-5 text-gray-400">
              Reliable home services delivered with care, quality and
              professionalism.
            </p>

            {/* Contact Details */}
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p>📞 +91 9390212572</p>
              <p>✉️ support@homecarex.com</p>
              <p>📍 India</p>
            </div>

          </div>

          {/* ================= COMPANY ================= */}
          <div>

            <h3 className="mb-3 text-base font-semibold">
              Company
            </h3>

            <ul className="space-y-2 text-sm">

              <li>
                <NavLink
                  to="/"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Home
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/about"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  About
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/contact"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Contact
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/careers"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Careers
                </NavLink>
              </li>

            </ul>

          </div>

          {/* ================= SERVICES ================= */}
          <div>

            <h3 className="mb-3 text-base font-semibold">
              Services
            </h3>

            <ul className="space-y-2 text-sm">

              <li>
                <NavLink
                  to="/services"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Cleaning
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/services"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Nursing
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/services"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Elder Care
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/services"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Baby Care
                </NavLink>
              </li>

            </ul>

          </div>

          {/* ================= SUPPORT ================= */}
          <div>

            <h3 className="mb-3 text-base font-semibold">
              Support
            </h3>

            <ul className="space-y-2 text-sm">

              <li>
                <NavLink
                  to="/help"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Help Center
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/contact"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Contact Us
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/faq"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  FAQ
                </NavLink>
              </li>

            </ul>

          </div>

          {/* ================= LEGAL ================= */}
          <div>

            <h3 className="mb-3 text-base font-semibold">
              Legal
            </h3>

            <ul className="space-y-2 text-sm">

              <li>
                <NavLink
                  to="/privacy"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Privacy Policy
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/terms"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Terms & Conditions
                </NavLink>
              </li>

              <li>
                <NavLink
                  to="/cookies"
                  className="text-gray-300 transition hover:text-[#ff8a3d]"
                >
                  Cookie Policy
                </NavLink>
              </li>

            </ul>

          </div>

        </div>

        {/* ================= SOCIAL MEDIA ================= */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-white/20 pt-5 sm:flex-row">

          <div>

            <h3 className="text-base font-semibold">
              Follow Us
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Stay connected with HomeCareX.
            </p>

          </div>

          <div className="flex items-center gap-3">

            {/* Facebook */}
            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:-translate-y-1 hover:bg-[#ff8a3d]"
            >
              <Facebook size={17} />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:-translate-y-1 hover:bg-[#ff8a3d]"
            >
              <Instagram size={17} />
            </a>

            {/* X / Twitter */}
            <a
              href="https://x.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X Twitter"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:-translate-y-1 hover:bg-[#ff8a3d]"
            >
              <Twitter size={17} />
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-all duration-200 hover:-translate-y-1 hover:bg-[#ff8a3d]"
            >
              <Linkedin size={17} />
            </a>

          </div>

        </div>

        {/* ================= COPYRIGHT ================= */}
        <div className="mt-5 border-t border-white/20 pt-4 text-center text-sm text-gray-300">
          © 2026 HomeCareX. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;