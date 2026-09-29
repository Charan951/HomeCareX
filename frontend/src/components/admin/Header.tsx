import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, HelpCircle, LifeBuoy, Menu, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { allAdminPages } from '@/config/adminNav';
import { useClickOutside } from '@/hooks/useClickOutside';
import { ProfileMenu } from './ProfileMenu';

export interface HeaderNotification {
  id: string;
  title: string;
  time: string;
  href?: string;
}

interface HeaderProps {
  /** Unread notifications. Wire to the notifications API when it exists. */
  notifications?: HeaderNotification[];
}

/** Sticky admin header: menu/collapse, page search, notifications, help, profile. */
export const Header: React.FC<HeaderProps> = ({ notifications = [] }) => {
  const navigate = useNavigate();
  const isCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const bellRef = useClickOutside<HTMLDivElement>(bellOpen, () => setBellOpen(false));
  const helpRef = useClickOutside<HTMLDivElement>(helpOpen, () => setHelpOpen(false));
  const searchRef = useClickOutside<HTMLDivElement>(query !== '', () => setQuery(''));

  const needle = query.trim().toLowerCase();
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
    <header className="admin-topbar">
      <button type="button" onClick={toggleMobileMenu} className="icon-btn mobile-only" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <button
        type="button"
        onClick={toggleSidebar}
        className="icon-btn desktop-only"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <div className="topbar-search" ref={searchRef}>
        <Search className="topbar-search__icon" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onSearchKey}
          placeholder="Search pages…"
          className="topbar-search__input"
          aria-label="Search admin pages"
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

      <div className="topbar-right">
        <div className="popover" ref={helpRef}>
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            className="icon-btn"
            aria-label="Help"
            aria-expanded={helpOpen}
          >
            <HelpCircle size={20} />
          </button>
          {helpOpen && (
            <div className="popover__panel profile-menu">
              <Link to="/admin/support" className="profile-menu__item" onClick={() => setHelpOpen(false)}>
                <LifeBuoy size={16} /> Support tickets
              </Link>
              <a className="profile-menu__item" href="/docs" target="_blank" rel="noreferrer">
                <BookOpen size={16} /> Admin guide
              </a>
            </div>
          )}
        </div>

        <div className="popover" ref={bellRef}>
          <button
            type="button"
            onClick={() => setBellOpen((v) => !v)}
            className="icon-btn hcx-bell"
            aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ''}`}
            aria-expanded={bellOpen}
          >
            <Bell size={20} />
            {notifications.length > 0 && <span className="hcx-bell__dot" />}
          </button>
          {bellOpen && (
            <div className="popover__panel hcx-notif-panel">
              {notifications.length === 0 ? (
                <p className="hcx-notif-panel__empty">You&apos;re all caught up.</p>
              ) : (
                <ul>
                  {notifications.slice(0, 5).map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setBellOpen(false);
                          if (n.href) navigate(n.href);
                        }}
                      >
                        <span>{n.title}</span>
                        <small>{n.time}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/admin/notifications" className="hcx-notif-panel__all" onClick={() => setBellOpen(false)}>
                View all notifications
              </Link>
            </div>
          )}
        </div>

        <ProfileMenu />
      </div>
    </header>
  );
};

export default Header;
