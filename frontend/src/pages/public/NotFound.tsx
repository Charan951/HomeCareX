import React from "react";
import { Link } from "react-router-dom";

/* =========================================================
   STYLES (same design tokens as the other HomeCareX pages)
   Indigo #4338ca = structure and text, Orange #ff8a3d = action
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.hcx-nf { font-family: 'DM Sans', system-ui, sans-serif; color: #1b1b3a; }
.hcx-nf h1, .hcx-nf h2, .hcx-nf .display {
  font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

@keyframes nf-digit { 0% { opacity: 0; transform: translateY(0.6em) scale(.8); filter: blur(8px); } 100% { opacity: 1; transform: none; filter: blur(0); } }
@keyframes nf-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes nf-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.08); } }
@keyframes nf-bob { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-12px) rotate(4deg); } }
@keyframes nf-shadow { 0%,100% { transform: scaleX(1); opacity: .25; } 50% { transform: scaleX(.7); opacity: .12; } }

.nf-digit { display: inline-block; opacity: 0; animation: nf-digit .9s cubic-bezier(.2,.8,.2,1) forwards; }
.nf-in { opacity: 0; animation: nf-fade .8s cubic-bezier(.2,.7,.2,1) forwards; }
.nf-drift { animation: nf-drift 14s ease-in-out infinite; }
.nf-bob { animation: nf-bob 4s ease-in-out infinite; }
.nf-shadow { animation: nf-shadow 4s ease-in-out infinite; }

.hcx-nf a:focus-visible { outline: 3px solid #ff8a3d; outline-offset: 3px; border-radius: 10px; }

@media (prefers-reduced-motion: reduce) {
  .hcx-nf *, .hcx-nf *::before, .hcx-nf *::after { animation: none !important; transition: none !important; }
  .nf-digit, .nf-in { opacity: 1 !important; transform: none !important; filter: none !important; }
}
`;

const quickLinks = [
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const NotFound: React.FC = () => {
  return (
    <div className="hcx-nf relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#eef0ff] to-white px-6 py-16">
      <style>{styles}</style>

      {/* Background blobs */}
      <div className="nf-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/20 blur-3xl" />
      <div
        className="nf-drift pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/20 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />

      <main className="w-full max-w-2xl text-center">
        {/* Big 404 with a floating house as the zero */}
        <div className="display flex items-center justify-center text-[6.5rem] font-extrabold leading-none text-[#4338ca] sm:text-[9rem]" aria-label="Error 404">
          <span className="nf-digit" style={{ animationDelay: "0.1s" }} aria-hidden>
            4
          </span>

          <span className="relative mx-1 inline-flex flex-col items-center sm:mx-3" aria-hidden>
            <span
              className="nf-digit"
              style={{ animationDelay: "0.25s" }}
            >
              <span className="nf-bob inline-flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-[1.75rem] bg-[#ff8a3d] text-5xl shadow-[0_20px_40px_-15px_rgba(255,138,61,0.9)] ring-8 ring-white sm:h-32 sm:w-32 sm:rounded-[2.25rem] sm:text-7xl">
                🏠
              </span>
            </span>
            <span className="nf-shadow mt-4 h-2 w-16 rounded-full bg-[#1e1b6e] blur-sm" />
          </span>

          <span className="nf-digit" style={{ animationDelay: "0.4s" }} aria-hidden>
            4
          </span>
        </div>

        <p
          className="nf-in mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4338ca] shadow-sm ring-1 ring-[#4338ca]/10"
          style={{ animationDelay: "0.6s" }}
        >
          <span className="h-2 w-2 rounded-full bg-[#ff8a3d]" />
          Page not found
        </p>

        <h1
          className="nf-in mt-5 text-3xl font-extrabold leading-[1.1] text-[#1e1b6e] sm:text-5xl"
          style={{ animationDelay: "0.7s" }}
        >
          We can&apos;t find that page
        </h1>

        <p
          className="nf-in mx-auto mt-5 max-w-md text-lg leading-8 text-[#5b5b7a]"
          style={{ animationDelay: "0.8s" }}
        >
          The page you are looking for may have moved or doesn&apos;t exist. Head back home or try one of
          the links below.
        </p>

        <div className="nf-in mt-9 flex flex-wrap justify-center gap-4" style={{ animationDelay: "0.95s" }}>
          <Link
            to="/"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-7 py-4 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
          >
            <span className="transition-transform duration-300 group-hover:-translate-x-1" aria-hidden>
              ←
            </span>
            Go home
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center rounded-xl border-2 border-[#4338ca] px-7 py-4 font-bold text-[#4338ca] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4338ca] hover:text-white"
          >
            Contact us
          </Link>
        </div>

        <nav
          className="nf-in mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-[#4338ca]/15 pt-6 text-sm"
          style={{ animationDelay: "1.1s" }}
          aria-label="Helpful links"
        >
          <span className="text-[#5b5b7a]">Popular pages:</span>
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-bold text-[#4338ca] underline-offset-4 transition-colors duration-300 hover:text-[#e06a12] hover:underline"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  );
};

export default NotFound;