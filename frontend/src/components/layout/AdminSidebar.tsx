import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, X } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { adminNavGroups, allAdminPages } from '@/config/adminNav';
import { HomeCarexMark } from '@/components/band/Homecarexmark';

export const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen);
  const closeMobileMenu = useUIStore((state) => state.closeMobileMenu);

  const user = useAuthStore((state) => state.user);
  const displayName = (user?.name as string) ?? 'Admin';

  // Accordion: only one nav group is open at a time.
  // Start with whichever group contains the page we're currently on.
  const activeGroup = adminNavGroups.find((group) =>
    group.items.some((item) => item.path === pathname),
  );
  const [openGroup, setOpenGroup] = useState<string>(
    activeGroup ? activeGroup.groupName : adminNavGroups[0]?.groupName ?? '',
  );

  const toggleGroup = (groupName: string) => {
    setOpenGroup((current) => (current === groupName ? '' : groupName));
  };

  // Whatever page is active right now, shown under the logo as a quick guide
  // e.g. "Overview / Dashboard" -- falls back to "Admin Dashboard" on /admin.
  const currentPage = allAdminPages.find((page) => page.path === pathname);
  const pageGuide = currentPage
    ? `${currentPage.groupName} / ${currentPage.label}`
    : 'Admin Dashboard';

  const sidebarClassName = [
    'admin-sidebar',
    isCollapsed ? 'is-collapsed' : '',
    isMobileMenuOpen ? 'is-mobile-open' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const handleSignOut = () => {
    useAuthStore.setState({ isAuthenticated: false, user: null });
    navigate('/login');
  };

  return (
    <>
      {isMobileMenuOpen && <div className="sidebar-overlay" onClick={closeMobileMenu} />}

      <aside className={sidebarClassName}>
        <div className="sidebar-brand">
          <div className="sidebar-brand__top">
            <div className="sidebar-brand__logo">
              <span className="sidebar-brand__icon">
                <HomeCarexMark size={22} />
              </span>
              {!isCollapsed && <span className="sidebar-brand__name">HomeCareX</span>}
            </div>
            <button onClick={closeMobileMenu} className="sidebar-close-btn">
              <X size={20} />
            </button>
          </div>
          {!isCollapsed && <p className="sidebar-brand__guide">{pageGuide}</p>}
        </div>

        <nav className="sidebar-nav">
          {adminNavGroups.map((group) => {
            const isOpen = isCollapsed ? true : openGroup === group.groupName;
            return (
              <div key={group.groupName} className="nav-group">
                {!isCollapsed && (
                  <button
                    type="button"
                    className="nav-group__title nav-group__toggle"
                    onClick={() => toggleGroup(group.groupName)}
                  >
                    <span>{group.groupName}</span>
                    <ChevronDown
                      size={14}
                      className={`nav-group__chevron${isOpen ? ' is-open' : ''}`}
                    />
                  </button>
                )}
                {isOpen && (
                  <ul className="nav-list">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            end
                            onClick={closeMobileMenu}
                            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                          >
                            <Icon className="nav-link__icon" size={20} />
                            {!isCollapsed && <span className="nav-link__label">{item.label}</span>}
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
            onClick={() => {
              closeMobileMenu();
              navigate('/admin/profile');
            }}
          >
            <span className="avatar">{displayName.charAt(0).toUpperCase()}</span>
            {!isCollapsed && <span className="profile-name">{displayName}</span>}
          </button>
          <button onClick={handleSignOut} className="sidebar-signout-btn" title="Sign out">
            <LogOut size={18} />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;