import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] overflow-hidden flex flex-col lg:flex-row bg-[#fafbff] relative">
      {/* LEFT SIDE: Visual branding panel with storytelling, trust badges & stats */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative bg-neutral-950 text-white flex-col justify-between p-6 xl:p-8 select-none overflow-hidden max-w-full">
        {/* Background Image with softer, lighter gradient */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/home-cleaning.jpg"
            alt="HomeCareX Professional Home Services"
            className="w-full h-full object-cover object-center brightness-[0.98] contrast-[1.03]"
          />
          {/* Directional gradient: gentle scrim on left behind text, fading to transparent on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>

        {/* Content wrapper: fits strictly within 100dvh with zero scrolling */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-full overflow-hidden select-none">
          {/* Top: Highlighted Brand Name, Sub-badge, and Slogan Badge */}
          <div className="shrink-0 flex items-start justify-between w-full pt-3 sm:pt-4 xl:pt-5">
            <div className="space-y-1.5">
              <Link to="/" className="inline-flex items-center gap-2 group transition-transform duration-200 hover:scale-105" aria-label="HomeCareX Home">
                <span className="font-black text-2xl xl:text-3xl tracking-tight text-white drop-shadow-lg">
                  HomeCare<span className="text-[#ff8a3d]">X</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-[#ff8a3d] animate-pulse" />
              </Link>
              {/* Trusted Service Platform directly below the brand name */}
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#ff8a3d]/25 border border-[#ff8a3d]/40 text-[#ffa66b] text-[11px] font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  <Sparkles size={11} className="text-[#ff8a3d]" />
                  Trusted Service Platform
                </div>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full text-xs text-white drop-shadow-sm">
              <Sparkles size={12} className="text-[#ff8a3d]" />
              <span className="font-medium tracking-wide">Your Home, Our Care</span>
            </div>
          </div>

          {/* Lower section: Story headline & trust pills */}
          <div className="w-full max-w-lg mt-auto mb-5 space-y-3">
            <h1 className="text-2xl xl:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-xl">
              Every home has a story. <br />
              <span className="text-[#ff8a3d]">HomeCareX</span> is here to care for yours.
            </h1>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-2 pt-0.5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-white drop-shadow-md">
                <ShieldCheck size={14} className="text-[#ff8a3d]" />
                <span>Verified Specialists</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-white drop-shadow-md">
                <CheckCircle2 size={14} className="text-[#ff8a3d]" />
                <span>Upfront Pricing</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-xs font-semibold text-white drop-shadow-md">
                <Clock size={14} className="text-[#ff8a3d]" />
                <span>On-Time Guarantee</span>
              </div>
            </div>
          </div>

          {/* Bottom: Minimal Stats */}
          <div className="shrink-0 pt-3 border-t border-white/20 w-full">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-lg xl:text-xl font-extrabold text-[#ff8a3d] drop-shadow-lg">10,000+</p>
                <p className="text-xs font-semibold text-white/95 drop-shadow-md">Happy Homes</p>
              </div>
              <div>
                <p className="text-lg xl:text-xl font-extrabold text-[#ff8a3d] drop-shadow-lg">500+</p>
                <p className="text-xs font-semibold text-white/95 drop-shadow-md">Verified Pros</p>
              </div>
              <div>
                <p className="text-lg xl:text-xl font-extrabold text-[#ff8a3d] drop-shadow-lg">4.8 / 5.0</p>
                <p className="text-xs font-semibold text-white/95 drop-shadow-md">Rating</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Cardless, full-viewport form area directly over background */}
      <div className="w-full lg:w-1/2 h-full max-h-[100dvh] overflow-y-auto lg:overflow-hidden overflow-x-hidden relative flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 py-6">
        <div className="pointer-events-none absolute top-0 right-0 h-72 w-72 bg-[#4338ca]/10 rounded-full blur-3xl -z-0" aria-hidden="true" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 bg-[#ff8a3d]/10 rounded-full blur-3xl -z-0" aria-hidden="true" />

        {/* Clean transparent/flat form container */}
        <div className="w-full max-w-[420px] relative z-10 animate-fadeUp my-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;