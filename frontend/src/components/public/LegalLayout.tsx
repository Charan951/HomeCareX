import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertCircle, ArrowUp, ChevronDown, Printer } from "lucide-react";
import type { LegalDocumentContent } from "../../content/terms";
import { ROUTES } from "../../constants/routes";

/* =========================================================================
   TEXT FORMATTING & LINK RESOLUTION HELPER
   Highlights main points with amber badge styling and makes all links active.
   ========================================================================= */

const renderInteractiveText = (text: string): React.ReactNode => {
  const tokenRegex =
    /(support@homecarex\.com|privacy@homecarex\.com|\+91\s*93902\s*12572|\/contact|Privacy Policy|Terms and Conditions|Terms & Conditions|Help Center|refund policy|cancellation policy)/gi;

  const parts = text.split(tokenRegex);
  return parts.map((part, index) => {
    const lower = part.toLowerCase();
    if (lower === "support@homecarex.com" || lower === "privacy@homecarex.com") {
      return (
        <a
          key={index}
          href={`mailto:${part}`}
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </a>
      );
    }
    if (lower.replace(/\s+/g, "") === "+919390212572") {
      return (
        <a
          key={index}
          href="tel:+919390212572"
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </a>
      );
    }
    if (lower === "/contact") {
      return (
        <Link
          key={index}
          to={ROUTES.CONTACT}
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </Link>
      );
    }
    if (lower === "help center") {
      return (
        <Link
          key={index}
          to={ROUTES.CONTACT}
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </Link>
      );
    }
    if (lower === "privacy policy") {
      return (
        <Link
          key={index}
          to={ROUTES.PRIVACY}
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </Link>
      );
    }
    if (lower === "terms and conditions" || lower === "terms & conditions") {
      return (
        <Link
          key={index}
          to={ROUTES.TERMS}
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </Link>
      );
    }
    if (lower === "refund policy") {
      return (
        <a
          key={index}
          href="#refund-policy"
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </a>
      );
    }
    if (lower === "cancellation policy") {
      return (
        <a
          key={index}
          href="#cancellation"
          className="font-semibold text-brand-600 underline underline-offset-2 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

const LegalParagraph: React.FC<{ paragraph: string }> = ({ paragraph }) => {
  // Regex to detect bullet and main-point label before a colon
  const colonMatch = paragraph.match(
    /^([•\-*]?\s*)((?:[A-Z0-9][\w\s&/()'"-]{1,55})):(\s+)(.*)$/s
  );

  if (colonMatch) {
    const hasBullet = Boolean(colonMatch[1].trim());
    const label = colonMatch[2].trim();
    const rest = colonMatch[4];

    if (hasBullet) {
      return (
        <div className="flex items-start gap-3 my-2.5">
          <span
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
            aria-hidden="true"
          />
          <p className="text-base text-gray-700 leading-relaxed">
            <strong className="font-bold text-gray-950">{label}:</strong>{" "}
            <span>{renderInteractiveText(rest)}</span>
          </p>
        </div>
      );
    }

    return (
      <p className="my-3 text-base text-gray-700 leading-relaxed">
        <strong className="font-bold text-gray-950">{label}:</strong>{" "}
        <span>{renderInteractiveText(rest)}</span>
      </p>
    );
  }

  if (paragraph.startsWith("• ") || paragraph.startsWith("- ")) {
    const content = paragraph.replace(/^[•\-]\s*/, "");
    return (
      <div className="flex items-start gap-3 my-2.5">
        <span
          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600"
          aria-hidden="true"
        />
        <p className="text-base text-gray-700 leading-relaxed">
          {renderInteractiveText(content)}
        </p>
      </div>
    );
  }

  return (
    <p className="my-3 text-base text-gray-700 leading-relaxed">
      {renderInteractiveText(paragraph)}
    </p>
  );
};

interface LegalLayoutProps extends LegalDocumentContent {
  className?: string;
}

export const LegalLayout: React.FC<LegalLayoutProps> = ({
  title,
  description,
  lastUpdated,
  pendingApprovalNotice,
  sections = [],
  className = "",
}) => {
  const location = useLocation();
  const [activeId, setActiveId] = useState<string>("");
  const [mobileTocOpen, setMobileTocOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Deep linking: scroll to hash on load or hash change
  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash) {
      setActiveId(hash);
      const target = document.getElementById(hash);
      if (target) {
        const timer = setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth" });
        }, 80);
        return () => clearTimeout(timer);
      }
    } else if (sections.length > 0) {
      setActiveId(sections[0].id);
    }
  }, [location.hash, sections]);

  // Track scroll position for active section & back to top button
  useEffect(() => {
    if (sections.length === 0) return;

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      const scrollPos = window.scrollY + 160;
      let currentActive = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop <= scrollPos) {
          currentActive = section.id;
        }
      }
      setActiveId(currentActive);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const handlePrint = () => {
    window.print();
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={`hcx-legal-doc min-h-screen bg-white text-gray-900 ${className}`}>
      {/* Print-specific style block */}
      <style>{`
        @media print {
          /* Hide non-content elements */
          header, footer, nav, .legal-no-print, button, .hcx-hd, .hcx-ft {
            display: none !important;
          }
          body, .hcx-legal-doc {
            background: #ffffff !important;
            color: #000000 !important;
          }
          .legal-doc-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            padding: 12pt 0 !important;
            border: none !important;
          }
          h1, h2 {
            page-break-after: avoid !important;
            break-after: avoid !important;
            color: #000000 !important;
          }
          a {
            color: #000000 !important;
            text-decoration: none !important;
          }
        }
      `}</style>

      {/* ================= MAIN CONTAINER ================= */}
      <div className="legal-doc-container mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-14">
        
        {/* ================= BREADCRUMB NAVIGATION ================= */}
        <nav aria-label="Breadcrumb" className="legal-no-print mb-6">
          <ol className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <li>
              <Link
                to={ROUTES.HOME}
                className="hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
              >
                Home
              </Link>
            </li>
            <li aria-hidden="true" className="text-gray-400">/</li>
            <li className="text-gray-700 font-semibold">{title}</li>
          </ol>
        </nav>

        {/* 2-Column Grid: TOC on Left Side, Document Content on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT SIDE: TABLE OF CONTENTS ================= */}
          <aside className="legal-no-print hidden lg:block lg:col-span-4 sticky top-28 self-start">
            <nav
              aria-label="Table of contents"
              className="rounded-lg border border-gray-200 bg-gray-50/80 p-5 shadow-2xs"
            >
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 border-b border-gray-200 pb-2.5">
                Table of Contents
              </h2>
              <ol className="space-y-1 text-xs sm:text-sm max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                {sections.map((section, idx) => {
                  const isActive = activeId === section.id;
                  return (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        className={`group flex items-baseline gap-2 py-1.5 px-2.5 rounded transition-all duration-150 ${
                          isActive
                            ? "bg-white font-semibold text-brand-600 shadow-2xs border-l-2 border-brand-600"
                            : "text-gray-600 hover:text-gray-950 hover:bg-white/80"
                        }`}
                      >
                        <span className={`font-mono text-xs shrink-0 ${isActive ? "text-brand-600" : "text-gray-400 group-hover:text-gray-600"}`}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="leading-snug">
                          {section.title.replace(/^\d+\.\s*/, "")}
                        </span>
                      </a>
                    </li>
                  );
                })}
              </ol>
            </nav>
          </aside>

          {/* ================= MOBILE / TABLET TOC TOGGLE ================= */}
          <div className="legal-no-print lg:hidden col-span-1">
            <button
              type="button"
              onClick={() => setMobileTocOpen(!mobileTocOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 text-left shadow-2xs transition hover:bg-gray-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              aria-expanded={mobileTocOpen}
              aria-controls="mobile-toc-list"
            >
              <span className="text-sm font-bold text-gray-800">
                Table of Contents ({sections.length} Sections)
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-600 transition-transform duration-200 ${
                  mobileTocOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {mobileTocOpen && (
              <div
                id="mobile-toc-list"
                className="mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
              >
                <ol className="space-y-1.5 text-xs">
                  {sections.map((section, idx) => (
                    <li key={section.id}>
                      <a
                        href={`#${section.id}`}
                        onClick={() => setMobileTocOpen(false)}
                        className={`block rounded py-1.5 px-2 transition ${
                          activeId === section.id
                            ? "bg-brand-50 font-bold text-brand-600"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <span className="font-mono text-gray-400 mr-2">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {section.title.replace(/^\d+\.\s*/, "")}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* ================= RIGHT SIDE: DOCUMENT MAIN CONTENT ================= */}
          <div className="lg:col-span-8 w-full max-w-[70ch]">
            
            {/* Document Header */}
            <header className="pb-6 border-b border-gray-200">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-1">
                    HomeCareX
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950">
                    {title}
                  </h1>
                </div>

                {/* Print Action Button */}
                <div className="legal-no-print shrink-0">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    aria-label={`Print ${title}`}
                  >
                    <Printer size={14} aria-hidden="true" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              <p className="mt-3 text-base text-gray-600 leading-relaxed">
                {description}
              </p>

              <p className="mt-3 text-xs font-semibold text-gray-500">
                Last updated: <span className="text-gray-800">{lastUpdated}</span>
              </p>

              {/* Legal Approval Notice Banner */}
              {pendingApprovalNotice && (
                <div
                  role="alert"
                  className="mt-6 rounded-lg border-l-4 border-amber-500 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 sm:text-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-amber-950">
                        {pendingApprovalNotice}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-800">
                        This document serves as an informational draft outlining HomeCareX platform terms and policies. It will be updated upon formal legal verification.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </header>

            {/* Document Content Sections (Continuous document, NO CARDS!) */}
            {sections.length === 0 ? (
              /* Empty State Fallback */
              <div className="my-12 rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <h2 className="text-base font-bold text-gray-900">No Content Available</h2>
                <p className="mt-1 text-sm text-gray-600">
                  This document is currently being updated. Please check back shortly.
                </p>
                <Link
                  to={ROUTES.HOME}
                  className="mt-4 inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  Return Home
                </Link>
              </div>
            ) : (
              <main id="legal-document-content" tabIndex={-1} className="space-y-12 pt-8 focus:outline-none">
                {sections.map((section) => (
                  <section
                    key={section.id}
                    id={section.id}
                    aria-labelledby={`heading-${section.id}`}
                    className="scroll-mt-28"
                  >
                    {/* Section Heading + Subtle Divider */}
                    <div className="flex items-baseline justify-between gap-4 border-b border-gray-200 pb-2 mb-4">
                      <h2
                        id={`heading-${section.id}`}
                        className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950"
                      >
                        {section.title}
                      </h2>
                      <a
                        href={`#${section.id}`}
                        className="legal-no-print text-gray-400 hover:text-brand-600 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded px-1 transition-colors"
                        aria-label={`Direct link to ${section.title}`}
                        title="Direct link to this section"
                      >
                        #
                      </a>
                    </div>

                    {/* Section Paragraphs with Highlighted Main Points and Working Links */}
                    <div className="space-y-3.5 text-base text-gray-700 leading-relaxed">
                      {section.content.map((paragraph, pIdx) => (
                        <LegalParagraph
                          key={`${section.id}-p-${pIdx}`}
                          paragraph={paragraph}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </main>
            )}
          </div>
        </div>

        {/* ================= BACK TO TOP FLOATING BUTTON ================= */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="legal-no-print fixed bottom-6 right-6 z-40 flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 shadow-md transition hover:bg-gray-50 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Scroll back to top"
          >
            <ArrowUp size={14} aria-hidden="true" />
            <span>Top</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LegalLayout;
