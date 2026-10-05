import React from "react";

export const publicStyles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.hcx {
  --indigo: #4338ca;
  --indigo-deep: #1e1b6e;
  --indigo-tint: #eef0ff;
  --orange: #ff8a3d;
  --orange-tint: #fff3ea;
  --ink: #1b1b3a;
  --muted: #5b5b7a;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--ink);
}
.hcx h1, .hcx h2, .hcx h3, .hcx .display {
  font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

@keyframes hcx-word {
  from { opacity: 0; transform: translateY(0.5em); filter: blur(6px); }
  to   { opacity: 1; transform: none; filter: blur(0); }
}
@keyframes hcx-fade {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: none; }
}
@keyframes hcx-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-10px); }
}
@keyframes hcx-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50%      { transform: translate(30px, -24px) scale(1.08); }
}

.hcx-word {
  display: inline-block;
  opacity: 0;
  animation: hcx-word .8s cubic-bezier(.2,.7,.2,1) forwards;
}
.hcx-in {
  opacity: 0;
  animation: hcx-fade .8s cubic-bezier(.2,.7,.2,1) forwards;
}
.hcx-float {
  animation: hcx-float 6s ease-in-out infinite;
}
.hcx-drift {
  animation: hcx-drift 14s ease-in-out infinite;
}

.hcx-reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1);
}
.hcx-reveal.is-in {
  opacity: 1;
  transform: none;
}

/* Accordion smooth transition */
.hcx-acc {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows .35s ease;
}
.hcx-acc.open {
  grid-template-rows: 1fr;
}
.hcx-acc > div {
  overflow: hidden;
}

/* Accessible focus styling */
.hcx a:focus-visible,
.hcx button:focus-visible {
  outline: 3px solid var(--orange);
  outline-offset: 3px;
  border-radius: 10px;
}
.hcx input:focus-visible {
  outline: none;
}

@media (prefers-reduced-motion: reduce) {
  .hcx *, .hcx *::before, .hcx *::after {
    animation: none !important;
    transition: none !important;
  }
  .hcx-word, .hcx-in, .hcx-reveal {
    opacity: 1 !important;
    transform: none !important;
  }
}
`;

interface PublicPageBackgroundProps {
  variant?: "hero" | "cta" | "tint" | "plain";
  children: React.ReactNode;
  className?: string;
}

export const PublicPageBackground: React.FC<PublicPageBackgroundProps> = ({
  variant = "hero",
  children,
  className = "",
}) => {
  if (variant === "hero") {
    return (
      <div className={`relative isolate overflow-hidden bg-gradient-to-b from-[#eef0ff] to-white ${className}`}>
        <div
          className="hcx-drift pointer-events-none absolute -right-40 -top-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-[#ff8a3d]/20 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="hcx-drift pointer-events-none absolute -bottom-48 -left-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-[#4338ca]/20 blur-3xl"
          style={{ animationDelay: "-7s" }}
          aria-hidden="true"
        />
        {children}
      </div>
    );
  }

  if (variant === "cta") {
    return (
      <div className={`relative isolate overflow-hidden bg-white ${className}`}>
        <div
          className="hcx-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="hcx-drift pointer-events-none absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
          aria-hidden="true"
        />
        {children}
      </div>
    );
  }

  if (variant === "tint") {
    return <div className={`bg-[#eef0ff] ${className}`}>{children}</div>;
  }

  return <div className={`bg-white ${className}`}>{children}</div>;
};

export default PublicPageBackground;
