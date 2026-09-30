import React from "react";
import { Link } from "react-router-dom";

/* =========================================================
   STYLES (same design tokens as Home, About and Services)
   Indigo #4338ca = structure and text, Orange #ff8a3d = action
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.hcx-un { font-family: 'DM Sans', system-ui, sans-serif; color: #1b1b3a; }
.hcx-un h1, .hcx-un .display {
  font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

@keyframes un-pop { 0% { opacity: 0; transform: scale(.6) rotate(-8deg); } 70% { transform: scale(1.06) rotate(2deg); } 100% { opacity: 1; transform: none; } }
@keyframes un-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes un-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.08); } }
@keyframes un-ring { 0% { transform: scale(1); opacity: .5; } 100% { transform: scale(1.9); opacity: 0; } }
@keyframes un-shackle { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }

.un-pop { opacity: 0; animation: un-pop .9s cubic-bezier(.2,.8,.2,1) .1s forwards; }
.un-in { opacity: 0; animation: un-fade .8s cubic-bezier(.2,.7,.2,1) forwards; }
.un-drift { animation: un-drift 14s ease-in-out infinite; }
.un-ring { animation: un-ring 2.8s ease-out infinite; }
.un-shackle { animation: un-shackle 3s ease-in-out infinite; }

.hcx-un a:focus-visible { outline: 3px solid #ff8a3d; outline-offset: 3px; border-radius: 10px; }

@media (prefers-reduced-motion: reduce) {
  .hcx-un *, .hcx-un *::before, .hcx-un *::after { animation: none !important; transition: none !important; }
  .un-pop, .un-in { opacity: 1 !important; transform: none !important; }
  .un-ring { display: none; }
}
`;

const Unauthorized: React.FC = () => {
  return (
    <div className="hcx-un relative isolate flex min-h-[80vh] items-center justify-center overflow-hidden bg-gradient-to-b from-[#eef0ff] to-white px-6 py-16">
      <style>{styles}</style>

      {/* Background blobs */}
      <div className="un-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/20 blur-3xl" />
      <div
        className="un-drift pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/20 blur-3xl"
        style={{ animationDelay: "-7s" }}
      />

      <main className="w-full max-w-xl text-center" role="alert">
        {/* Lock icon */}
        <div className="un-pop relative mx-auto flex h-28 w-28 items-center justify-center">
          <span className="un-ring absolute inset-0 rounded-full bg-[#ff8a3d]/40" aria-hidden />
          <span className="un-ring absolute inset-0 rounded-full bg-[#ff8a3d]/30" style={{ animationDelay: "1.4s" }} aria-hidden />
          <span className="relative flex h-28 w-28 items-center justify-center rounded-3xl bg-[#4338ca] shadow-[0_20px_40px_-15px_rgba(67,56,202,0.7)] ring-8 ring-white">
            <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" aria-hidden>
              <g className="un-shackle">
                <path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              </g>
              <rect x="5" y="10" width="14" height="10" rx="2.5" fill="#ff8a3d" />
              <circle cx="12" cy="14.5" r="1.4" fill="#1b1b3a" />
              <path d="M12 15.5v2" stroke="#1b1b3a" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
        </div>

        <p
          className="un-in mt-8 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4338ca] shadow-sm ring-1 ring-[#4338ca]/10"
          style={{ animationDelay: "0.35s" }}
        >
          <span className="h-2 w-2 rounded-full bg-[#ff8a3d]" />
          Error 403
        </p>

        <h1
          className="un-in mt-5 text-4xl font-extrabold leading-[1.1] text-[#1e1b6e] sm:text-5xl"
          style={{ animationDelay: "0.45s" }}
        >
          You don&apos;t have access to this page
        </h1>

        <p
          className="un-in mx-auto mt-5 max-w-md text-lg leading-8 text-[#5b5b7a]"
          style={{ animationDelay: "0.55s" }}
        >
          Your account doesn&apos;t have permission to view this page. If you think this is a
          mistake, contact us and we&apos;ll help.
        </p>

        <div className="un-in mt-9 flex flex-wrap justify-center gap-4" style={{ animationDelay: "0.7s" }}>
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
            Contact support
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Unauthorized;