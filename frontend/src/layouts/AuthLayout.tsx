import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Clock, CreditCard, Headphones, Star, Sparkles } from 'lucide-react';

const features = [
  { icon: ShieldCheck, title: 'Verified Professionals', desc: 'Background-checked partners you can trust.' },
  { icon: Clock, title: 'Real-Time Tracking', desc: 'Know exactly when help is on the way.' },
  { icon: CreditCard, title: 'Secure Payments', desc: 'Pay safely through the app, every time.' },
  { icon: Headphones, title: '24/7 Support', desc: "We're here whenever you need us." },
];

const stats = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '500+', label: 'Verified Partners' },
  { value: '50+', label: 'Cities Covered' },
  { value: '4.8★', label: 'Average Rating' },
];

const avatarColors = ['bg-brand-400', 'bg-accent-400', 'bg-brand-300', 'bg-accent-300'];

const AuthLayout: React.FC = () => {
  const location = useLocation();
  const showBackToHome = location.pathname === '/login';

  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex bg-gray-50">
      {/* Left branding panel — visible from lg (1024px) up */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-accent-900 text-white flex-col justify-between p-6 xl:p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-900 via-accent-800 to-brand-700" />
        <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-brand-500/40 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -left-24 h-80 w-80 rounded-full bg-accent-400/30 blur-3xl animate-blob-slow" />
        <div className="absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl animate-blob" style={{ animationDelay: '2s' }} />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent" />

        <div className="relative z-10 flex items-center justify-between animate-fadeUp">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="HomeCareX" className="h-8 xl:h-9 w-auto drop-shadow-lg" />
          </Link>
          <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md rounded-full pl-1.5 pr-2.5 py-1 border border-white/10 shadow-lg">
            <div className="flex -space-x-1.5">
              {avatarColors.map((c, i) => (
                <div
                  key={i}
                  className={`h-5 w-5 rounded-full ${c} border-2 border-accent-900 flex items-center justify-center text-[9px] font-semibold animate-floaty`}
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-[11px] text-white/90">Trusted by 10K+ families</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md xl:max-w-lg animate-fadeUp" style={{ animationDelay: '0.15s' }}>
          <div className="inline-flex items-center gap-1 bg-brand-400/15 border border-brand-400/30 text-brand-300 text-[11px] font-medium px-2.5 py-0.5 rounded-full mb-2">
            <Sparkles size={11} />
            Trusted home services platform
          </div>
          <h1 className="text-2xl xl:text-3xl font-bold leading-tight mb-2">
            Your Home, <span className="text-brand-400">Our Care</span>
          </h1>
          <p className="text-white/80 mb-3.5 max-w-md text-xs xl:text-sm line-clamp-2 leading-relaxed">
            Book trusted home service professionals in minutes — cleaning, repairs, and more, all in one platform.
          </p>

          <div className="space-y-2 xl:space-y-2.5 mb-3.5 max-w-md">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-2.5 group hover:translate-x-1 transition-transform duration-300">
                <div className="mt-0.5 h-7 w-7 rounded-md bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/10 group-hover:bg-brand-400/20 group-hover:border-brand-400/30 transition-colors duration-300">
                  <Icon size={14} />
                </div>
                <div>
                  <p className="font-semibold text-xs">{title}</p>
                  <p className="text-[11px] text-white/70 leading-tight">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial card with appropriate spacing and max-w-md */}
          <div className="max-w-md bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3 xl:p-3.5 my-3 xl:my-4 shadow-xl">
            <div className="flex gap-0.5 mb-1.5 text-brand-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
            <p className="text-xs text-white/90 italic leading-snug mb-1">
              Booked a plumber in under 5 minutes. Showed up on time, fixed everything — best home service experience I've had.
            </p>
            <p className="text-[10px] text-white/60">— Priya M., Bengaluru</p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-4 gap-3 border-t border-white/15 pt-3 xl:pt-4 animate-fadeUp" style={{ animationDelay: '0.3s' }}>
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-lg xl:text-xl font-bold text-brand-400">{s.value}</p>
              <p className="text-[10px] xl:text-[11px] text-white/70 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-8 relative bg-white overflow-y-auto">
        <div className="absolute top-0 right-0 h-64 w-64 bg-brand-100 rounded-full blur-3xl opacity-40 -z-0" />
        <div className="absolute bottom-0 left-0 h-64 w-64 bg-accent-100 rounded-full blur-3xl opacity-40 -z-0" />

        {showBackToHome && (
          <Link
            to="/"
            className="absolute top-6 left-6 flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent-700 hover:-translate-x-0.5 transition-all z-10"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        )}

        <Link to="/" className="lg:hidden mb-8 z-10">
          <img src="/logo.png" alt="HomeCareX" className="h-10 w-auto" />
        </Link>

        <div className="w-full max-w-md relative z-10 animate-fadeUp">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;