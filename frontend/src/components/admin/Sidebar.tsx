import React, { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/context/AuthContext';
import { adminNavGroups, findAdminPage } from '@/config/adminNav';
import { HomeCarexMark } from '@/components/band/Homecarexmark';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePermissions } from '@/hooks/usePermissions';

const visibleGroups = adminNavGroups.filter((group) => !group.hidden);

/**
 * Admin sidebar.
 * Desktop (>=1024px): sticky, can collapse to an icon-only strip.
 * Mobile: off-canvas drawer opened from the header, closes on route change,
 * overlay click or Escape.
 */
export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const { can } = usePermissions();

  const storedCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const isMobileMenuOpen = useUIStore((s) => s.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((s) => s.closeMobileMenu);
  // The drawer always shows labels, whatever the desktop preference is.
  const isCollapsed = storedCollapsed && isDesktop;

  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const displayName = (user?.name as string) ?? 'Admin';

  const currentPage = findAdminPage(pathname);
  const [openGroup, setOpenGroup] = useState<string>(currentPage?.groupName ?? 'Overview');

  // Keep the group of the current page open, and close the drawer, on navigation.
  useEffect(() => {
    const page = findAdminPage(pathname);
    if (page && !page.groupName.includes('Account')) setOpenGroup(page.groupName);
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && closeMobileMenu();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen, closeMobileMenu]);

  const handleSignOut = () => {
    void logout().finally(() => navigate('/login', { replace: true }));
  };

  const className = [
    'admin-sidebar',
    isCollapsed ? 'is-collapsed' : '',
    isMobileMenuOpen ? 'is-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={closeMobileMenu} aria-hidden />}

      <aside className={className} aria-label="Admin navigation">
        <div className="sidebar-brand">
          <div className="sidebar-brand__top">
            <div className="sidebar-brand__logo">
              <span className="sidebar-brand__icon">
                <HomeCarexMark size={22} />
              </span>
              {!isCollapsed && <span className="sidebar-brand__name">HomeCareX</span>}
            </div>
            <button
              type="button"
              onClick={closeMobileMenu}
              className="sidebar-close-btn"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>
          
        </div>

        <nav className="sidebar-nav">
          {visibleGroups.map((group) => {
            const items = group.items.filter((item) => can(item.permission));
            if (items.length === 0) return null;
            const isOpen = isCollapsed || openGroup === group.groupName;
            return (
              <div key={group.groupName} className="nav-group">
                {!isCollapsed && (
                  <button
                    type="button"
                    className="nav-group__title nav-group__toggle"
                    aria-expanded={isOpen}
                    onClick={() => setOpenGroup((cur) => (cur === group.groupName ? '' : group.groupName))}
                  >
                    <span>{group.groupName}</span>
                    <ChevronDown size={14} className={`nav-group__chevron${isOpen ? ' is-open' : ''}`} />
                  </button>
                )}
                {isOpen && (
                  <ul className="nav-list">
                    {items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            end={item.path === '/admin'}
                            title={isCollapsed ? item.label : undefined}
                            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                          >
                            <Icon className="nav-link__icon" size={20} aria-hidden />
                            {!isCollapsed && <span className="nav-link__label">{item.label}</span>}
                            {isCollapsed && <span className="sr-only">{item.label}</span>}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-footer__user sidebar-footer__user-btn"
            title={isCollapsed ? displayName : undefined}
            onClick={() => navigate('/admin/profile')}
          >
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
            {!isCollapsed && <span className="profile-name">{displayName}</span>}
          </button>
          <button type="button" onClick={handleSignOut} className="sidebar-signout-btn" title="Sign out">
            <LogOut size={18} />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
