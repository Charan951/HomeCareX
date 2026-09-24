import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#2D1B69] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">

        <div className="grid gap-8 md:grid-cols-3">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold">
              HOME<span className="text-[#FF8A00]">CARE</span>X
            </h2>

            <p className="mt-3 text-sm text-gray-300">
              Your Home, Our Care
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Quick Links
            </h3>

            <ul className="space-y-2 text-sm text-gray-300">
              <li>Home</li>
              <li>Services</li>
              <li>About</li>
              <li>Contact</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              Contact Us
            </h3>

            <ul className="space-y-2 text-sm text-gray-300">
              <li>📞 +91 9390212572</li>
              <li>✉️ support@homecarex.com</li>
              <li>📍 India</li>
            </ul>
          </div>

        </div>

        <div className="mt-8 border-t border-white/20 pt-5 text-center text-sm text-gray-300">
          © 2026 HomeCareX. All rights reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;