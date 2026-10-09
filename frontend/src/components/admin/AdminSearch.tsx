import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { allAdminPages } from '@/config/adminNav';
import { useClickOutside } from '@/hooks/useClickOutside';

// Pages whose own table is filtered by this search instead of jumping between pages.
const PAGE_SEARCH: Record<string, string> = {
  '/admin/partners': 'Search name, email, phone or city…',
  '/admin/manage-partners': 'Search name, designation, email or phone…',
  '/admin/audit-logs': 'Search actor, action, entity, ID or IP…',
  '/admin/categories': 'Search name, slug or description…',
  '/admin/services': 'Search name, slug or category…',
};

/** Search bar shown in the row below the header. */
export const AdminSearch: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const pageSearch = useUIStore((s) => s.pageSearch);
  const setPageSearch = useUIStore((s) => s.setPageSearch);

  const pagePlaceholder = PAGE_SEARCH[pathname.replace(/\/+$/, '')];
  const isPageSearch = Boolean(pagePlaceholder);

  // Start every page with an empty search box.
  useEffect(() => {
    setPageSearch('');
  }, [pathname, setPageSearch]);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const searchRef = useClickOutside<HTMLDivElement>(query !== '', () => setQuery(''));

  const needle = isPageSearch ? '' : query.trim().toLowerCase();
  const results = needle
    ? allAdminPages
        .filter((p) => p.label.toLowerCase().includes(needle) || p.groupName.toLowerCase().includes(needle))
        .slice(0, 8)
    : [];

  const go = (path: string) => {
    navigate(path);
    setQuery('');
    setActive(0);
  };

  const onSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[Math.min(active, results.length - 1)].path);
    }
  };

  return (
    <div className="topbar-search" ref={searchRef}>
      <Search className="topbar-search__icon" aria-hidden />
      <input
        type="search"
        value={isPageSearch ? pageSearch : query}
        onChange={(e) => {
          if (isPageSearch) {
            setPageSearch(e.target.value);
            return;
          }
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={onSearchKey}
        placeholder={pagePlaceholder ?? 'Search pages…'}
        className="topbar-search__input"
        aria-label={isPageSearch ? 'Search this page' : 'Search admin pages'}
        role="combobox"
        aria-expanded={results.length > 0}
        aria-controls="admin-search-results"
      />
      {needle && (
        <ul className="topbar-search__results" id="admin-search-results" role="listbox">
          {results.length === 0 ? (
            <li className="hcx-search-empty">No pages match “{query}”</li>
          ) : (
            results.map((page, i) => (
              <li key={page.path} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(page.path)}
                  className={`topbar-search__result-btn${i === active ? ' is-active' : ''}`}
                >
                  {page.label}
                  <span className="topbar-search__result-group">{page.groupName}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default AdminSearch;