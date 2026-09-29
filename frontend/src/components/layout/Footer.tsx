import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t-4 border-blue-600 bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-9 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_1fr] lg:gap-12">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              HOME<span className="text-blue-400">CARE</span>X
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-400">
              Your Home, Our Care
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Quick links</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-400">
              <li>Home</li>
              <li>Services</li>
              <li>About</li>
              <li>Contact</li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Contact us</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Phone aria-hidden="true" size={16} className="shrink-0 text-blue-400" />
                <span>+91 9390212572</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail aria-hidden="true" size={16} className="shrink-0 text-blue-400" />
                <span>support@homecarex.com</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin aria-hidden="true" size={16} className="shrink-0 text-blue-400" />
                <span>India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-9 border-t border-slate-800 pt-5 text-center text-xs text-slate-500 sm:text-left">
          © 2026 HomeCareX. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
