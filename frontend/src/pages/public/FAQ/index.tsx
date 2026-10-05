import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { faqData, type FAQGroup } from "../../../content/faq";
import FaqSearch from "../../../components/public/FaqSearch";
import FaqAccordion from "../../../components/public/FaqAccordion";
import {
  PublicPageBackground,
  publicStyles,
} from "../../../components/public/PublicPageBackground";

const FAQPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [openIds, setOpenIds] = useState<string[]>([]);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  // Filter groups and questions based on search query and category filter
  const filteredGroups = useMemo<FAQGroup[]>(() => {
    return faqData.groups
      .filter((group) => {
        if (selectedGroup === "all") return true;
        return group.id === selectedGroup;
      })
      .map((group) => {
        if (!trimmedQuery) {
          return group;
        }

        const matchedQuestions = group.questions.filter((item) => {
          const qMatch = item.question.toLowerCase().includes(trimmedQuery);
          const aMatch = item.answer.toLowerCase().includes(trimmedQuery);
          return qMatch || aMatch;
        });

        return {
          ...group,
          questions: matchedQuestions,
        };
      })
      .filter((group) => group.questions.length > 0);
  }, [trimmedQuery, selectedGroup]);

  // Total matching questions count
  const totalMatches = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.questions.length, 0);
  }, [filteredGroups]);

  const totalQuestions = useMemo(() => {
    return faqData.groups.reduce((acc, g) => acc + g.questions.length, 0);
  }, []);

  const handleToggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  const handleExpandAll = () => {
    const allVisibleIds = filteredGroups.flatMap((g) => g.questions.map((q) => q.id));
    setOpenIds(allVisibleIds);
  };

  const handleCollapseAll = () => {
    setOpenIds([]);
  };

  return (
    <div className="hcx overflow-x-hidden bg-white">
      <style>{publicStyles}</style>

      {/* ================= HERO ================= */}
      <PublicPageBackground variant="hero">
        <section
          aria-labelledby="faq-page-heading"
          className="mx-auto max-w-4xl px-4 pt-6 pb-4 text-center sm:px-6 sm:pt-8 sm:pb-5 lg:pt-9 lg:pb-6"
        >
          <p
            className="hcx-in inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#4338ca] shadow-xs ring-1 ring-[#4338ca]/10 sm:text-sm"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
            {faqData.hero.eyebrow}
          </p>

          <h1
            id="faq-page-heading"
            className="mt-2 text-2xl font-extrabold leading-tight text-[#1e1b6e] sm:mt-2.5 sm:text-3xl lg:text-4xl"
          >
            {faqData.hero.heading}
          </h1>

          <p
            className="hcx-in mx-auto mt-1 max-w-lg text-xs leading-5 text-[#5b5b7a] sm:mt-1.5 sm:text-sm sm:leading-6"
            style={{ animationDelay: "0.15s" }}
          >
            {faqData.hero.description}
          </p>

          {/* Instant Search Bar */}
          <div className="hcx-in mt-3.5 sm:mt-4" style={{ animationDelay: "0.2s" }}>
            <FaqSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={handleClearSearch}
              resultCount={totalMatches}
              totalCount={totalQuestions}
            />
          </div>

          {/* Group Filter Chips directly under search for unified filtering */}
          <nav
            aria-label="FAQ category filter"
            className="hcx-in mt-3 flex flex-wrap items-center justify-center gap-1.5 sm:mt-3.5 sm:gap-2"
            style={{ animationDelay: "0.25s" }}
          >
            <button
              type="button"
              onClick={() => setSelectedGroup("all")}
              aria-pressed={selectedGroup === "all"}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] sm:text-sm ${
                selectedGroup === "all"
                  ? "bg-[#4338ca] text-white shadow-xs"
                  : "bg-white text-[#1e1b6e] ring-1 ring-[#4338ca]/15 hover:bg-[#eef0ff]"
              }`}
            >
              All Topics
            </button>
            {faqData.groups.map((group) => {
              const isSelected = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroup(group.id)}
                  aria-pressed={isSelected}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] sm:text-sm ${
                    isSelected
                      ? "bg-[#4338ca] text-white shadow-xs"
                      : "bg-white text-[#1e1b6e] ring-1 ring-[#4338ca]/15 hover:bg-[#eef0ff]"
                  }`}
                >
                  {group.title}
                </button>
              );
            })}
          </nav>
        </section>
      </PublicPageBackground>

      {/* ================= FAQ CONTENT & GROUPS ================= */}
      <main className="bg-[#eef0ff]/30 pt-3 pb-10 sm:pt-4 sm:pb-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          {/* Quick controls (Expand/Collapse all) when items are present */}
          {filteredGroups.length > 0 && (
            <div className="mb-2.5 flex items-center justify-between px-1 sm:mb-3">
              <span className="text-xs font-medium text-[#5b5b7a]">
                Showing <strong className="text-[#1e1b6e]">{totalMatches}</strong> questions
                {selectedGroup !== "all" && ` in ${selectedGroup}`}
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#4338ca]">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="rounded px-1.5 py-0.5 transition hover:bg-[#eef0ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d]"
                >
                  Expand all
                </button>
                <span className="text-[#5b5b7a]/40" aria-hidden="true">
                  •
                </span>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="rounded px-1.5 py-0.5 transition hover:bg-[#eef0ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d]"
                >
                  Collapse all
                </button>
              </div>
            </div>
          )}

          {/* FAQ Groups List */}
          {filteredGroups.length > 0 ? (
            <div className="space-y-5 sm:space-y-6">
              {filteredGroups.map((group) => (
                <section
                  key={group.id}
                  aria-labelledby={`faq-group-title-${group.id}`}
                  className="space-y-2.5"
                >
                  <div className="flex items-center gap-2 border-b border-[#4338ca]/10 pb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-[#4338ca] text-[11px] font-bold text-white shadow-xs">
                      {group.title.charAt(0)}
                    </span>
                    <h2
                      id={`faq-group-title-${group.id}`}
                      className="text-base font-bold text-[#1e1b6e] sm:text-lg"
                    >
                      {group.title}
                    </h2>
                    <span className="ml-auto rounded-full bg-[#eef0ff] px-2 py-0.5 text-[11px] font-semibold text-[#4338ca]">
                      {group.questions.length} {group.questions.length === 1 ? "item" : "items"}
                    </span>
                  </div>

                  <FaqAccordion
                    items={group.questions}
                    openIds={openIds}
                    onToggle={handleToggle}
                    searchQuery={trimmedQuery}
                  />
                </section>
              ))}
            </div>
          ) : (
            /* EMPTY SEARCH STATE - Clean and compact */
            <div
              role="alert"
              aria-live="polite"
              className="rounded-2xl border border-dashed border-[#4338ca]/25 bg-white p-5 text-center shadow-xs sm:p-7"
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff8a3d]/15 text-lg text-[#e06a12]">
                🔍
              </div>
              <h2 className="mt-2 text-base font-bold text-[#1e1b6e] sm:text-lg">
                No results found
              </h2>
              <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#5b5b7a] sm:text-sm">
                We couldn't find any questions or answers matching &ldquo;
                <strong className="text-[#1e1b6e]">{searchQuery}</strong>
                &rdquo;. Try searching with a different keyword or check your spelling.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="rounded-xl bg-[#ff8a3d] px-4 py-2 text-xs font-bold text-[#1b1b3a] shadow-xs transition hover:bg-[#ff7a22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] sm:text-sm"
                >
                  Clear search keyword
                </button>
                {selectedGroup !== "all" && (
                  <button
                    type="button"
                    onClick={() => setSelectedGroup("all")}
                    className="rounded-xl border border-[#4338ca] px-4 py-2 text-xs font-bold text-[#4338ca] transition hover:bg-[#eef0ff] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] sm:text-sm"
                  >
                    View all topics
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ================= FINAL CONTACT CTA ================= */}
      <PublicPageBackground variant="cta">
        <section
          aria-labelledby="faq-contact-heading"
          className="px-4 py-10 text-center sm:px-6 sm:py-14"
        >
          <div className="mx-auto max-w-2xl">
            <h2
              id="faq-contact-heading"
              className="text-xl font-extrabold text-[#1e1b6e] sm:text-2xl"
            >
              {faqData.contactCta.title}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-[#5b5b7a] sm:text-sm sm:leading-6">
              {faqData.contactCta.description}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                to={faqData.contactCta.actionHref}
                className="rounded-xl bg-[#ff8a3d] px-5 py-2.5 text-xs font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22] sm:px-6 sm:py-3 sm:text-sm"
              >
                {faqData.contactCta.actionLabel}
              </Link>
              <Link
                to="/services"
                className="rounded-xl border-2 border-[#4338ca] px-5 py-2.5 text-xs font-bold text-[#4338ca] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4338ca] hover:text-white sm:px-6 sm:py-3 sm:text-sm"
              >
                Browse Services
              </Link>
            </div>
          </div>
        </section>
      </PublicPageBackground>
    </div>
  );
};

export default FAQPage;
