import React, { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";

/* =========================================================
   STYLES (same design tokens as the other HomeCareX pages)
   Indigo #4338ca = structure and text, Orange #ff8a3d = action
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.hcx-ft { font-family: 'DM Sans', system-ui, sans-serif; }
.hcx-ft h2, .hcx-ft h3, .hcx-ft .display {
  font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.01em;
}

@keyframes ft-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.08); } }
.ft-drift { animation: ft-drift 14s ease-in-out infinite; }

/* Columns fade up one after another once the footer is visible */
.ft-col { opacity: 0; transform: translateY(22px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.ft-visible .ft-col { opacity: 1; transform: none; }

/* Link with a small orange dash that grows on hover */
.ft-link { position: relative; display: inline-block; padding-left: 0; color: #c9c8e6; transition: color .3s ease, padding-left .3s ease; }
.ft-link::before {
  content: ""; position: absolute; left: 0; top: 50%; height: 2px; width: 0; border-radius: 2px;
  background: #ff8a3d; transform: translateY(-50%); transition: width .3s ease;
}
.ft-link:hover, .ft-link.is-active { color: #ffffff; padding-left: 18px; }
.ft-link:hover::before, .ft-link.is-active::before { width: 12px; }

.hcx-ft a:focus-visible, .hcx-ft button:focus-visible { outline: 3px solid #ff8a3d; outline-offset: 3px; border-radius: 8px; }

@media (prefers-reduced-motion: reduce) {
  .hcx-ft *, .hcx-ft *::before, .hcx-ft *::after { animation: none !important; transition: none !important; }
  .ft-col { opacity: 1 !important; transform: none !important; }
}
`;

/* =========================================================
   DATA
========================================================= */

interface FooterLink {
  to: string;
  label: string;
}

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Company",
    links: [
      { to: "/", label: "Home" },
      { to: "/about", label: "About" },
      { to: "/contact", label: "Contact" },
      { to: "/careers", label: "Careers" },
    ],
  },
  {
    title: "Services",
    links: [
      { to: "/services/home-cleaning", label: "Home Cleaning" },
      { to: "/services/plumbing", label: "Plumbing" },
      { to: "/services/electrical", label: "Electrical" },
      { to: "/services/painting", label: "Painting" },
      { to: "/services/appliance-repair", label: "Appliance Repair" },
    ],
  },
  {
    title: "Support",
    links: [
      { to: "/help", label: "Help Center" },
      { to: "/contact", label: "Contact Us" },
      { to: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms & Conditions" },
      { to: "/cookies", label: "Cookie Policy" },
    ],
  },
];

/* Inline icons: no extra package needed, so nothing can fail to import */
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const icons = {
  phone: (
    <svg {...iconProps} className="h-4 w-4">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
  mail: (
    <svg {...iconProps} className="h-4 w-4">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  ),
  pin: (
    <svg {...iconProps} className="h-4 w-4">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  facebook: (
    <svg {...iconProps} className="h-[18px] w-[18px]">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  instagram: (
    <svg {...iconProps} className="h-[18px] w-[18px]">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  ),
  x: (
    <svg {...iconProps} className="h-[18px] w-[18px]">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  ),
  linkedin: (
    <svg {...iconProps} className="h-[18px] w-[18px]">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  ),
};

const socials = [
  { label: "Facebook", href: "https://www.facebook.com/", icon: icons.facebook },
  { label: "Instagram", href: "https://www.instagram.com/", icon: icons.instagram },
  { label: "X", href: "https://x.com/", icon: icons.x },
  { label: "LinkedIn", href: "https://www.linkedin.com/", icon: icons.linkedin },
];

/* =========================================================
   COMPONENT
========================================================= */

const Footer: React.FC = () => {
  const footerRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  // Reveal the footer columns once, when the footer scrolls into view
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const delay = (n: number): React.CSSProperties => ({ transitionDelay: `${n * 100}ms` });

  return (
    <footer
      ref={footerRef}
      className={`hcx-ft relative isolate overflow-hidden bg-[#1e1b6e] text-white ${visible ? "ft-visible" : ""}`}
    >
      <style>{styles}</style>

      {/* Background glow */}
      <div className="ft-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/15 blur-3xl" />
      <div
        className="ft-drift pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/40 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />

      {/* Orange accent line on top */}
      <div className="h-1 w-full bg-gradient-to-r from-[#4338ca] via-[#ff8a3d] to-[#4338ca]" />

      <div className="mx-auto max-w-7xl px-6 pb-8 pt-14">
        {/* ================= FOOTER CONTENT ================= */}
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-8">
          {/* ================= BRAND ================= */}
          <div className="ft-col sm:col-span-2 md:col-span-3 lg:col-span-2" style={delay(0)}>
            <NavLink to="/" aria-label="HomeCareX Home" className="display inline-block text-3xl font-extrabold tracking-tight">
              HOME<span className="text-[#ff8a3d]">CARE</span>X
            </NavLink>

            <p className="mt-2 text-sm font-medium text-indigo-200">Your home, our care</p>

            <p className="mt-3 max-w-xs text-sm leading-6 text-indigo-100/70">
              Reliable home services delivered with care, quality and professionalism.
            </p>

            {/* Contact details */}
            <ul className="mt-6 space-y-3 text-sm text-indigo-100">
              <li>
                <a href="tel:+919390212572" className="group inline-flex items-center gap-3 transition-colors duration-300 hover:text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#ff8a3d] transition duration-300 group-hover:bg-[#ff8a3d] group-hover:text-[#1b1b3a]">
                    {icons.phone}
                  </span>
                  +91 9390212572
                </a>
              </li>
              <li>
                <a href="mailto:support@homecarex.com" className="group inline-flex items-center gap-3 transition-colors duration-300 hover:text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#ff8a3d] transition duration-300 group-hover:bg-[#ff8a3d] group-hover:text-[#1b1b3a]">
                    {icons.mail}
                  </span>
                  support@homecarex.com
                </a>
              </li>
              <li className="inline-flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[#ff8a3d]">
                  {icons.pin}
                </span>
                India
              </li>
            </ul>
          </div>

          {/* ================= LINK COLUMNS ================= */}
          {columns.map((col, i) => (
            <nav key={col.title} className="ft-col" style={delay(i + 1)} aria-label={col.title}>
              <h3 className="mb-4 text-base font-bold text-white">{col.title}</h3>
              <ul className="space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={`${col.title}-${link.label}`}>
                    <NavLink
                      to={link.to}
                      end={link.to === "/"}
                      className={({ isActive }) => `ft-link ${isActive ? "is-active" : ""}`}
                    >
                      {link.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* ================= SOCIAL MEDIA ================= */}
        <div
          className="ft-col mt-12 flex flex-col items-center justify-between gap-5 border-t border-white/15 pt-8 sm:flex-row"
          style={delay(5)}
        >
          <div className="text-center sm:text-left">
            <h3 className="text-base font-bold">Follow us</h3>
            <p className="mt-1 text-sm text-indigo-100/70">Stay connected with HomeCareX.</p>
          </div>

          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition duration-300 hover:-translate-y-1 hover:bg-[#ff8a3d] hover:text-[#1b1b3a] hover:shadow-[0_10px_25px_-10px_rgba(255,138,61,0.9)]"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* ================= COPYRIGHT ================= */}
        <div
          className="ft-col mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-sm text-indigo-100/80 sm:flex-row"
          style={delay(6)}
        >
          <p>© {new Date().getFullYear()} HomeCareX. All rights reserved.</p>

          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 font-medium text-white transition duration-300 hover:bg-[#ff8a3d] hover:text-[#1b1b3a]"
          >
            Back to top
            <span className="transition-transform duration-300 group-hover:-translate-y-1" aria-hidden>
              ↑
            </span>
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;