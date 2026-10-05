import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { aboutData } from "../../../content/about";
import { ROUTES } from "../../../constants/routes";
import {
  PublicPageBackground,
  publicStyles,
} from "../../../components/public/PublicPageBackground";

/* =========================================================
   SCROLL REVEAL HELPER (Parity with public layout standards)
========================================================= */

function useInView<T extends HTMLElement>(threshold = 0.1) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -30px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}

const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = "" }) => {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`hcx-reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const SectionHead: React.FC<{
  id?: string;
  eyebrow?: string;
  title: string;
  text?: string;
  centered?: boolean;
  eyebrowClassName?: string;
  titleClassName?: string;
  textClassName?: string;
}> = ({
  id,
  eyebrow,
  title,
  text,
  centered = true,
  eyebrowClassName = "",
  titleClassName = "",
  textClassName = "",
}) => (
  <Reveal className={`mb-8 max-w-3xl sm:mb-10 ${centered ? "mx-auto text-center" : ""}`}>
    {eyebrow && (
      <p
        className={`mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#eef0ff] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#4338ca] ${eyebrowClassName}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" aria-hidden="true" />
        {eyebrow}
      </p>
    )}
    <h2
      id={id}
      className={`text-2xl font-extrabold text-[#1e1b6e] sm:text-3xl lg:text-[2.25rem] lg:leading-[1.18] ${titleClassName}`}
    >
      {title}
    </h2>
    {text && (
      <p className={`mt-3 text-sm leading-6 text-[#5b5b7a] sm:text-base sm:leading-7 ${textClassName}`}>
        {text}
      </p>
    )}
  </Reveal>
);

/* =========================================================
   HOMECAREX ABOUT PAGE COMPONENT
   Strict 11-section hierarchy with zero unsupported claims.
========================================================= */

const AboutPage: React.FC = () => {
  const {
    hero,
    story,
    whatWeDo,
    mission,
    vision,
    trust,
    quality,
    team,
    values,
    howItWorks,
    cta,
  } = aboutData;

  // SEO & Head Management
  useEffect(() => {
    document.title = "About HomeCareX | Home Services Made Simpler";

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      "content",
      "Learn about HomeCareX, our mission, vision, and how our digital home-services marketplace connects customers with service partners."
    );
  }, []);

  return (
    <div className="hcx overflow-x-hidden bg-white">
      <style>{publicStyles}</style>

      {/* =========================================================
          1. HERO (Clean Gradient without Background Image)
          Title: "About HomeCareX"
          Subtitle: "Making Home Services Simpler, One Booking at a Time."
          Primary CTA: Explore Services | Secondary CTA: Become a Partner
          ========================================================= */}
      <section
        aria-labelledby="about-hero-title"
        className="relative isolate overflow-hidden bg-gradient-to-b from-[#eef0ff] via-[#f7f8ff] to-white pt-16 pb-16 sm:pt-20 sm:pb-20 lg:pt-24 lg:pb-24"
      >
        {/* Subtle Ambient Glowing Accents (No Background Image) */}
        <div
          className="hcx-drift pointer-events-none absolute -right-32 -top-24 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="hcx-drift pointer-events-none absolute -bottom-24 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/15 blur-3xl"
          style={{ animationDelay: "-7s" }}
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-6 text-center">
          {/* Eyebrow Pill (if provided) */}
          {hero.eyebrow && (
            <p
              className="hcx-in inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#4338ca] shadow-xs ring-1 ring-[#4338ca]/15 backdrop-blur-md"
              style={{ animationDelay: "0.05s" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" aria-hidden="true" />
              {hero.eyebrow}
            </p>
          )}

          {/* Title: About HomeCareX */}
          <h1
            id="about-hero-title"
            className="mt-3 text-4xl font-extrabold tracking-tight text-[#1e1b6e] sm:text-5xl md:text-6xl lg:text-[4.25rem] leading-[1.08]"
          >
            About <span className="text-[#4338ca]">HomeCareX</span>
          </h1>

          {/* Subtitle: Making Home Services Simpler, One Booking at a Time. */}
          <p
            className="hcx-in mt-4 max-w-3xl text-xl font-bold leading-snug text-[#1e1b6e] sm:mt-5 sm:text-2xl md:text-3xl"
            style={{ animationDelay: "0.15s" }}
          >
            {hero.subtitle}
          </p>

          {/* Supporting Description */}
          <p
            className="hcx-in mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#5b5b7a] sm:mt-5 sm:text-base sm:leading-7"
            style={{ animationDelay: "0.3s" }}
          >
            {hero.description}
          </p>

          {/* Action CTAs */}
          <div
            className="hcx-in mt-7 flex flex-wrap items-center justify-center gap-3.5 sm:mt-8"
            style={{ animationDelay: "0.45s" }}
          >
            <Link
              to={hero.primaryCta.href}
              className="group inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-7 py-3 text-sm font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
            >
              {hero.primaryCta.label}
              <span
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
            <Link
              to={hero.secondaryCta.href}
              className="inline-flex items-center rounded-xl border-2 border-[#4338ca] bg-white/90 px-7 py-3 text-sm font-bold text-[#4338ca] shadow-xs backdrop-blur-md transition duration-300 hover:bg-[#4338ca] hover:text-white"
            >
              {hero.secondaryCta.label}
            </Link>
          </div>

          {/* Highlights Strip */}
          <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-3 sm:gap-5">
            {hero.highlights.map((h, i) => (
              <Reveal key={h.title} delay={i * 90}>
                <div className="flex items-center gap-3.5 rounded-2xl border border-[#4338ca]/10 bg-white/90 p-4 text-left shadow-xs backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:shadow-sm">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef0ff] text-xl shadow-2xs">
                    {h.icon}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[#1e1b6e]">{h.title}</h3>
                    <p className="text-xs text-[#5b5b7a]">{h.subtitle}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          2. OUR STORY
          Authentic problem statement without invented dates/stories.
          ========================================================= */}
      <section
        aria-labelledby="about-story-title"
        className="border-t border-[#4338ca]/10 bg-white py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
            <Reveal className="lg:col-span-7">
              <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[#eef0ff] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#4338ca]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" aria-hidden="true" />
                {story.eyebrow}
              </p>
              <h2
                id="about-story-title"
                className="text-2xl font-extrabold leading-tight text-[#1e1b6e] sm:text-3xl lg:text-4xl"
              >
                {story.heading}
              </h2>

              {/* Callout Quote */}
              <div className="my-5 rounded-2xl border-l-4 border-[#ff8a3d] bg-[#fff3ea]/50 p-4">
                <p className="text-sm font-bold text-[#1e1b6e] sm:text-base">
                  &ldquo;{story.introQuote}&rdquo;
                </p>
              </div>

              {/* Narrative Paragraphs */}
              <div className="space-y-3.5 text-sm leading-6 text-[#5b5b7a] sm:text-base sm:leading-7">
                {story.paragraphs.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>

              {/* Secondary exploration links */}
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  to={ROUTES.SERVICES}
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#4338ca] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#3730a3]"
                >
                  View Service Catalog
                  <span
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
                <Link
                  to={ROUTES.CONTACT}
                  className="inline-flex items-center rounded-xl border border-[#4338ca]/30 px-5 py-3 text-sm font-semibold text-[#1e1b6e] transition hover:bg-[#eef0ff]"
                >
                  Contact Our Team
                </Link>
              </div>
            </Reveal>

            {/* Challenges Addressed Card */}
            <Reveal delay={150} className="lg:col-span-5">
              <div className="rounded-3xl border border-[#4338ca]/15 bg-[#fbfbfe] p-6 shadow-sm sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff8a3d] text-xl font-bold text-[#1b1b3a] shadow-xs">
                  🎯
                </div>
                <h3 className="mt-5 text-xl font-bold text-[#1e1b6e]">
                  {story.challengesTitle}
                </h3>
                <div className="mt-5 space-y-4">
                  {story.challenges.map((c, i) => (
                    <div
                      key={c.title}
                      className="rounded-2xl border border-[#4338ca]/10 bg-white p-4 shadow-2xs"
                    >
                      <h4 className="flex items-center gap-2 text-sm font-bold text-[#1e1b6e]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eef0ff] text-xs font-bold text-[#4338ca]">
                          {i + 1}
                        </span>
                        {c.title}
                      </h4>
                      <p className="mt-1 text-xs leading-5 text-[#5b5b7a] sm:text-sm">
                        {c.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* =========================================================
          3. WHAT WE DO
          Featured Service Cards Grid (Desktop: 4, Tablet: 2, Mobile: 1)
          With View All Services → CTA
          ========================================================= */}
      <section
        aria-labelledby="about-what-we-do-title"
        className="bg-[#eef0ff] py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-what-we-do-title"
            eyebrow={whatWeDo.eyebrow}
            title={whatWeDo.heading}
            text={whatWeDo.description}
            eyebrowClassName="!text-[14px] font-bold border-0 shadow-none"
            titleClassName="!text-3xl sm:!text-4xl lg:!text-5xl lg:!leading-[1.12]"
            textClassName="!text-base sm:!text-lg sm:!leading-8 max-w-2xl mx-auto"
          />

          {/* 4 Real Featured Service Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {whatWeDo.services.map((service, idx) => (
              <Reveal key={service.id} delay={idx * 100}>
                <Link
                  to={service.href}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#4338ca]/15 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-[#ff8a3d] hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff8a3d]"
                  aria-label={`${service.name}: ${service.description}`}
                >
                  {/* Service Image with Category & Icon Overlays */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#eef0ff]">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"
                      aria-hidden="true"
                    />
                    {service.category && (
                      <span className="absolute left-3.5 top-3.5 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#4338ca] shadow-xs backdrop-blur-xs">
                        {service.category}
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-base shadow-xs backdrop-blur-xs">
                      {service.icon}
                    </span>
                  </div>

                  {/* Service Text Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-lg font-bold text-[#1e1b6e] transition-colors group-hover:text-[#4338ca] sm:text-xl">
                      {service.name}
                    </h3>
                    <p className="mt-2.5 flex-1 text-sm leading-6 text-[#5b5b7a]">
                      {service.description}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#ff8a3d] transition-colors group-hover:text-[#ff7a22]">
                      <span>{service.ctaText || "Explore"}</span>
                      <span
                        className="transition-transform duration-300 group-hover:translate-x-1"
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* Prominent View All Services CTA Button */}
          <Reveal delay={200} className="mt-12 text-center sm:mt-14">
            <Link
              to={ROUTES.SERVICES}
              className="group inline-flex items-center gap-2.5 rounded-xl bg-[#4338ca] px-9 py-4 text-base font-bold text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-[#3730a3] hover:shadow-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff8a3d]"
            >
              <span>View All Services</span>
              <span
                className="transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* =========================================================
          4. OUR MISSION
          "To make everyday home services easier to discover, request, and manage..."
          ========================================================= */}
      <section
        aria-labelledby="about-mission-title"
        className="bg-white py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-mission-title"
            eyebrow={mission.eyebrow}
            title={mission.heading}
            text={mission.supportingText}
          />

          {/* Mission Core Statement Banner */}
          <Reveal className="mx-auto mb-10 max-w-4xl">
            <div className="rounded-3xl border border-[#4338ca]/15 bg-gradient-to-r from-[#eef0ff] via-white to-[#fff3ea] p-6 text-center shadow-xs sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4338ca]">
                Our Mission Statement
              </p>
              <blockquote className="mt-3 text-xl font-extrabold leading-snug text-[#1e1b6e] sm:text-2xl md:text-3xl">
                &ldquo;{mission.statement}&rdquo;
              </blockquote>
            </div>
          </Reveal>

          {/* 3 Core Pillars */}
          <div className="grid gap-6 md:grid-cols-3">
            {mission.pillars.map((pillar, i) => (
              <Reveal key={pillar.title} delay={i * 100}>
                <div className="h-full rounded-2xl border border-[#4338ca]/15 bg-white p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4338ca] text-lg text-white shadow-xs">
                    {pillar.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1e1b6e]">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5b5b7a]">
                    {pillar.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          5. OUR VISION
          "To build a home-services ecosystem where customers can access services with greater confidence..."
          ========================================================= */}
      <section
        aria-labelledby="about-vision-title"
        className="bg-[#eef0ff] py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-vision-title"
            eyebrow={vision.eyebrow}
            title={vision.heading}
            text={vision.aspirationalNote}
          />

          {/* Vision Statement Banner */}
          <Reveal className="mx-auto mb-10 max-w-4xl">
            <div className="rounded-3xl border border-[#ff8a3d]/20 bg-white p-6 text-center shadow-xs sm:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#e06a12]">
                Our Long-Term Vision
              </p>
              <blockquote className="mt-3 text-xl font-extrabold leading-snug text-[#1e1b6e] sm:text-2xl md:text-3xl">
                &ldquo;{vision.statement}&rdquo;
              </blockquote>
            </div>
          </Reveal>

          {/* Vision Commitments */}
          <div className="grid gap-6 md:grid-cols-3">
            {vision.commitments.map((c, i) => (
              <Reveal key={c.title} delay={i * 120}>
                <div className="h-full rounded-3xl border border-[#4338ca]/15 bg-white p-6 shadow-xs transition duration-300 hover:border-[#ff8a3d] hover:shadow-md sm:p-7">
                  <span className="inline-block rounded-full bg-[#fff3ea] px-3 py-1 text-xs font-bold text-[#e06a12]">
                    Commitment {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-[#1e1b6e] sm:text-xl">
                    {c.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-[#5b5b7a]">
                    {c.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          6. TRUST & SAFETY
          Platform safeguards with subtle ongoing improvement note.
          ========================================================= */}
      <section
        aria-labelledby="about-trust-title"
        className="bg-white py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-trust-title"
            eyebrow={trust.eyebrow}
            title={trust.heading}
            text={trust.subtitle}
          />

          {/* Subtle mandatory ongoing improvement note */}
          <Reveal className="mx-auto mb-9 max-w-3xl">
            <div className="rounded-2xl border border-[#4338ca]/15 bg-[#eef0ff]/70 p-4 text-center">
              <p className="text-xs font-semibold text-[#4338ca] sm:text-sm">
                ℹ️ &ldquo;{trust.subtleNote}&rdquo;
              </p>
            </div>
          </Reveal>

          {/* 6 Safeguard Practices */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {trust.practices.map((practice, i) => (
              <Reveal key={practice.title} delay={(i % 3) * 100}>
                <div className="flex h-full flex-col rounded-3xl border border-[#4338ca]/15 bg-[#fbfbfe] p-6 shadow-xs transition duration-300 hover:border-[#ff8a3d] hover:shadow-md sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-2xs">
                      {practice.icon}
                    </span>
                    <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#4338ca]">
                      {practice.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-[#1e1b6e]">
                    {practice.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[#5b5b7a]">
                    {practice.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Secondary FAQ CTA at the bottom */}
          {trust.faqCta && (
            <Reveal delay={150} className="mt-10 sm:mt-12">
              <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#4338ca]/15 bg-[#fbfbfe] p-6 shadow-xs sm:flex-row sm:items-center sm:p-7">
                <div>
                  <h3 className="text-base font-bold text-[#1e1b6e] sm:text-lg">
                    {trust.faqCta.heading}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#5b5b7a] sm:text-sm">
                    {trust.faqCta.description}
                  </p>
                </div>
                <Link
                  to={trust.faqCta.href}
                  className="group inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#4338ca]/30 bg-white px-5 py-2.5 text-xs font-bold text-[#4338ca] shadow-2xs transition duration-300 hover:border-[#4338ca] hover:bg-[#eef0ff] hover:text-[#1e1b6e] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#ff8a3d] sm:text-sm"
                >
                  <span>{trust.faqCta.buttonLabel}</span>
                  <span
                    className="transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* =========================================================
          7. QUALITY
          "Our Approach to Quality" - Quality as a continuous process.
          ========================================================= */}
      <section
        aria-labelledby="about-quality-title"
        className="bg-[#eef0ff] py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-quality-title"
            eyebrow={quality.eyebrow}
            title={quality.heading}
            text={quality.description}
          />

          {/* Supporting Callout Message */}
          <Reveal className="mx-auto mb-10 max-w-3xl">
            <div className="rounded-2xl border-l-4 border-[#ff8a3d] bg-white p-5 shadow-xs">
              <p className="text-sm font-bold text-[#1e1b6e] sm:text-base">
                &ldquo;{quality.supportingMessage}&rdquo;
              </p>
            </div>
          </Reveal>

          {/* 5 Quality Process Steps */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {quality.steps.map((q, i) => (
              <Reveal key={q.title} delay={i * 90}>
                <div className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-xs ring-1 ring-[#4338ca]/10 transition duration-300 hover:-translate-y-1.5 hover:shadow-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff8a3d] text-sm font-extrabold text-[#1b1b3a]">
                    {q.step}
                  </div>
                  <h3 className="mt-3.5 text-base font-bold text-[#1e1b6e]">
                    {q.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#5b5b7a] sm:text-sm">
                    {q.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          8. OUR TEAM
          "The People Behind HomeCareX"
          Honest functional disciplines with ZERO fake names or portraits.
          ========================================================= */}
      <section
        aria-labelledby="about-team-title"
        className="bg-white py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-team-title"
            eyebrow={team.eyebrow}
            title={team.heading}
            text={team.subtitle}
          />

          {/* Intro Notice */}
          <Reveal className="mx-auto mb-10 max-w-3xl text-center">
            <p className="rounded-2xl border border-[#4338ca]/15 bg-[#eef0ff]/50 px-5 py-3 text-sm font-semibold text-[#1e1b6e]">
              &ldquo;{team.intro}&rdquo;
            </p>
          </Reveal>

          {/* 4 Functional Discipline Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.disciplines.map((item, i) => (
              <Reveal key={item.id} delay={i * 100}>
                <article className="flex h-full flex-col rounded-3xl border border-[#4338ca]/15 bg-[#fbfbfe] p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-[#4338ca] hover:shadow-md sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-2xs">
                      {item.icon}
                    </span>
                    <span className="rounded-md bg-[#eef0ff] px-2.5 py-1 text-[11px] font-bold text-[#4338ca]">
                      Discipline
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-[#1e1b6e]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#4338ca]">
                    {item.scope}
                  </p>
                  <p className="mt-2.5 text-xs leading-5 text-[#5b5b7a] sm:text-sm">
                    {item.description}
                  </p>

                  <div className="mt-5 border-t border-[#4338ca]/10 pt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#4338ca]">
                      Focus Areas:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-[#5b5b7a]">
                      {item.focusAreas.map((area) => (
                        <li key={area} className="flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-[#ff8a3d]" />
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          9. OUR VALUES
          Customer First, Transparency, Respect, Responsibility, Continuous Improvement
          ========================================================= */}
      <section
        aria-labelledby="about-values-title"
        className="bg-[#eef0ff] py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-values-title"
            eyebrow={values.eyebrow}
            title={values.heading}
            text={values.subtitle}
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.items.map((val, idx) => (
              <Reveal
                key={val.title}
                delay={idx * 90}
                className={idx === 4 ? "sm:col-span-2 lg:col-span-1" : ""}
              >
                <div className="flex h-full flex-col rounded-3xl border border-[#4338ca]/15 bg-white p-6 shadow-xs transition duration-300 hover:-translate-y-1 hover:border-[#ff8a3d] hover:shadow-md sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef0ff] text-xl">
                      {val.icon}
                    </span>
                    <span className="rounded-full bg-[#fff3ea] px-3 py-0.5 text-xs font-bold text-[#e06a12]">
                      Value {val.number}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-[#1e1b6e]">
                    {val.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-[#4338ca] sm:text-sm">
                    {val.tagline}
                  </p>
                  <p className="mt-2.5 text-xs leading-5 text-[#5b5b7a] sm:text-sm sm:leading-6">
                    {val.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          10. HOW HOMECAREX CONNECTS PEOPLE
          01 — Discover, 02 — Request, 03 — Connect
          ========================================================= */}
      <section
        aria-labelledby="about-connects-title"
        className="bg-white py-12 sm:py-16 lg:py-20"
      >
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            id="about-connects-title"
            eyebrow={howItWorks.eyebrow}
            title={howItWorks.heading}
            text={howItWorks.subtitle}
          />

          <div className="relative mt-8 grid gap-8 lg:grid-cols-3">
            {howItWorks.steps.map((st, i) => (
              <Reveal key={st.title} delay={i * 120} className="relative">
                <div className="flex h-full flex-col rounded-3xl border border-[#4338ca]/15 bg-[#fbfbfe] p-6 shadow-xs transition duration-300 hover:border-[#ff8a3d] hover:shadow-md sm:p-8">
                  {/* Step header */}
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef0ff] text-2xl shadow-2xs">
                      {st.icon}
                    </span>
                    <span className="rounded-full bg-[#ff8a3d] px-3.5 py-1 text-xs font-black text-[#1b1b3a]">
                      Step {st.number}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-extrabold text-[#1e1b6e] sm:text-2xl">
                    {st.number} — {st.title}
                  </h3>
                  <p className="mt-1 text-xs font-bold text-[#4338ca] sm:text-sm">
                    {st.summary}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-[#5b5b7a] sm:text-sm sm:leading-6">
                    {st.description}
                  </p>

                  <div className="mt-6 border-t border-[#4338ca]/10 pt-4">
                    <ul className="space-y-1.5 text-xs text-[#5b5b7a]">
                      {st.details.map((item) => (
                        <li key={item} className="flex items-center gap-2">
                          <span className="font-bold text-[#4338ca]" aria-hidden="true">✓</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================
          11. FINAL CTA
          Heading: "Your Home. Your Time. Simplified."
          CTAs: Explore Services & Become a Partner
          ========================================================= */}
      <PublicPageBackground variant="cta">
        <section
          aria-labelledby="about-cta-title"
          className="border-t border-[#4338ca]/10 px-6 py-14 text-center sm:py-18 lg:py-24"
        >
          <Reveal>
            <div className="mx-auto max-w-4xl">
              <h2
                id="about-cta-title"
                className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-[#1e1b6e] sm:text-4xl lg:text-5xl"
              >
                {cta.heading}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[#5b5b7a] sm:text-base sm:leading-7">
                {cta.description}
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3.5 sm:gap-4">
                <Link
                  to={cta.primaryCta.href}
                  className="rounded-xl bg-[#ff8a3d] px-7 py-3.5 text-sm font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22] sm:px-8 sm:py-4"
                >
                  {cta.primaryCta.label}
                </Link>
                <Link
                  to={cta.secondaryCta.href}
                  className="rounded-xl border-2 border-[#4338ca] bg-white/80 px-7 py-3.5 text-sm font-bold text-[#4338ca] backdrop-blur-xs transition duration-300 hover:-translate-y-0.5 hover:bg-[#4338ca] hover:text-white sm:px-8 sm:py-4"
                >
                  {cta.secondaryCta.label}
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </PublicPageBackground>
    </div>
  );
};

export default AboutPage;
