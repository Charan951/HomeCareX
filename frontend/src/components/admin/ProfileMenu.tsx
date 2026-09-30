import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuth } from '@/context/AuthContext';
import { useClickOutside } from '@/hooks/useClickOutside';

export const ProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const name = (user?.name as string) ?? 'Admin';
  const email = (user?.email as string) ?? 'admin@homecarex.com';

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const signOut = () => {
    setOpen(false);
    void logout().finally(() => navigate('/login', { replace: true }));
  };

  return (
    <div className="popover" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="profile-btn"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="avatar">{name.charAt(0).toUpperCase()}</span>
        <span className="profile-name desktop-only">{name}</span>
        <ChevronDown size={16} className="desktop-only" aria-hidden />
      </button>
      {open && (
        <div className="popover__panel profile-menu" role="menu">
          <div className="hcx-profile-menu__head">
            <strong>{name}</strong>
            <span>{email}</span>
          </div>
          <button type="button" role="menuitem" className="profile-menu__item" onClick={() => go('/admin/profile')}>
            <User size={16} /> My profile
          </button>
          <button type="button" role="menuitem" className="profile-menu__item" onClick={() => go('/admin/settings')}>
            <Settings size={16} /> Settings
          </button>
          <button type="button" role="menuitem" className="profile-menu__item is-danger" onClick={signOut}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;
