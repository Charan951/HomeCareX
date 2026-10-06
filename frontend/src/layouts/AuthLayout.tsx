import React from 'react';
import { Outlet } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="w-full min-h-[100dvh] h-[100dvh] overflow-hidden flex bg-gray-50">
      {/* Left branding panel: Uses the homepage hero section image with softer, lighter directional gradient scrim */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative bg-neutral-950 text-white flex-col justify-between p-6 xl:p-8 select-none overflow-hidden max-w-full">
        {/* Background Image with softer, lighter gradient: subtle contrast behind text, transparent on right */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/home-cleaning.jpg"
            alt="HomeCareX Professional Home Services"
            className="w-full h-full object-cover object-center brightness-[0.98] contrast-[1.03]"
          />
          {/* Softer, lighter directional gradient: gentle scrim on left behind text, fading to transparent on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          {/* Subtle vertical framing gradient for top and bottom contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
        </div>

        {/* Content wrapper: fits strictly within 100dvh with zero scrolling */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-full overflow-hidden select-none">
          {/* Top: Highlighted Brand Name, Sub-badge, and Slogan Badge (positioned a bit down) */}
          <div className="shrink-0 flex items-start justify-between w-full pt-3 sm:pt-4 xl:pt-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl xl:text-3xl tracking-tight text-white drop-shadow-lg">
                  HomeCare<span className="text-[#ff8a3d]">X</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-[#ff8a3d] animate-pulse" />
              </div>
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

          {/* Lower section: Positioned further down so the faces in the image are clearly visible */}
          <div className="w-full max-w-lg mt-auto mb-5 space-y-3">
            <h1 className="text-2xl xl:text-3xl font-black leading-tight tracking-tight text-white drop-shadow-xl">
              Every home has a story. <br />
              <span className="text-[#ff8a3d]">HomeCareX</span> is here to care for yours.
            </h1>

            {/* Minimal trust pills without subtext descriptions */}
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

      {/* Right form panel: Strictly fit to screen height with zero scroll on desktop */}
      <div className="w-full lg:w-1/2 h-full max-h-[100dvh] overflow-y-auto lg:overflow-hidden overflow-x-hidden relative bg-white flex flex-col justify-center items-center px-4 sm:px-6 py-4">
        <div className="absolute top-0 right-0 h-64 w-64 bg-brand-100 rounded-full blur-3xl opacity-40 -z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-accent-100 rounded-full blur-3xl opacity-40 -z-0 pointer-events-none" />

        <div className="w-full max-w-[480px] relative z-10 animate-fadeUp my-auto lg:my-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;