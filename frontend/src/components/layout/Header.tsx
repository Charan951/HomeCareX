import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const publicLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getLinkClassName = (isActive: boolean) =>
    `relative inline-flex min-h-10 items-center text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 ${
      isActive
        ? 'text-blue-700 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-blue-700'
        : 'text-slate-600 hover:text-blue-700'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-5 px-5 sm:px-6 lg:px-8">
        <Link to="/" aria-label="HomeCareX home" className="flex shrink-0 items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <img src="/logo.png" alt="HomeCareX" className="h-10 w-auto object-contain sm:h-11" />
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex lg:gap-9">
          {publicLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => getLinkClassName(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-4 ${
                isActive ? 'text-blue-800' : 'text-slate-600 hover:text-blue-700'
              }`
            }
          >
            Login
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                isActive ? 'bg-blue-800' : 'bg-blue-700 hover:bg-blue-800'
              }`
            }
          >
            Register
          </NavLink>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:hidden"
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
        >
          {isMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
        </button>
      </div>

      {isMenuOpen && (
        <div id="mobile-navigation" className="border-t border-slate-200 bg-white md:hidden">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col px-5 py-3 sm:px-6">
            {publicLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `flex min-h-12 items-center border-b border-slate-100 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive ? 'text-blue-700' : 'text-slate-700 hover:text-blue-700'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="flex gap-3 py-4">
              <NavLink
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                Register
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
