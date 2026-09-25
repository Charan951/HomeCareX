import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, PanelLeftClose, PanelLeftOpen, Search, User } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { allAdminPages } from '@/config/adminNav';

export const AdminTopbar: React.FC = () => {
  const navigate = useNavigate();

  const isCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu);

  const user = useAuthStore((state) => state.user);

  const [searchText, setSearchText] = useState('');
  const [isBellOpen, setIsBellOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const searchResults = searchText.trim()
    ? allAdminPages.filter((page) => page.label.toLowerCase().includes(searchText.toLowerCase()))
    : [];

  const goToPage = (path: string) => {
    navigate(path);
    setSearchText('');
  };

  const displayName = (user?.name as string) ?? 'Admin';

  return (
    <header className="admin-topbar">
      <button onClick={toggleMobileMenu} className="icon-btn mobile-only">
        <Menu size={20} />
      </button>

      <button onClick={toggleSidebar} className="icon-btn desktop-only">
        {isCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
      </button>

      <div className="topbar-search">
        <Search className="topbar-search__icon" />
        <input
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search pages..."
          className="topbar-search__input"
        />

        {searchResults.length > 0 && (
          <ul className="topbar-search__results">
            {searchResults.map((page) => (
              <li key={page.path}>
                <button onClick={() => goToPage(page.path)} className="topbar-search__result-btn">
                  {page.label}
                  <span className="topbar-search__result-group">{page.groupName}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="topbar-right">
        <div className="popover">
          <button onClick={() => setIsBellOpen((open) => !open)} className="icon-btn">
            <Bell size={20} />
          </button>
          {isBellOpen && <div className="popover__panel bell-panel">You&apos;re all caught up.</div>}
        </div>

        <div className="popover">
          <button onClick={() => setIsProfileOpen((open) => !open)} className="profile-btn">
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
            <span className="profile-name desktop-only">{displayName}</span>
            <ChevronDown size={16} className="desktop-only" />
          </button>
          {isProfileOpen && (
            <div className="popover__panel profile-menu">
              <p className="profile-menu__info">Signed in as {displayName}</p>
              <button
                type="button"
                className="profile-menu__item"
                onClick={() => {
                  setIsProfileOpen(false);
                  navigate('/admin/profile');
                }}
              >
                <User size={16} />
                View Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;