import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { useClickOutside } from '@/hooks/useClickOutside';

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

/** Sticky admin header: menu/collapse and notifications. */
export const Header: React.FC<HeaderProps> = ({ notifications = [] }) => {
  const navigate = useNavigate();
  const isCollapsed = useUIStore((s) => s.isSidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleMobileMenu = useUIStore((s) => s.toggleMobileMenu);

  const [bellOpen, setBellOpen] = useState(false);

  const bellRef = useClickOutside<HTMLDivElement>(bellOpen, () => setBellOpen(false));

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

      <div className="topbar-right">
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
      </div>
    </header>
  );
};

export default Header;