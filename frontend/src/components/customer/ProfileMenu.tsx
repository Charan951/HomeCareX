import { customerPath } from "@/routes/customerPath";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ProfileMenuProps {
  userName?: string;
  onLogout?: () => void;
}

export default function ProfileMenu({ userName = "Guest", onLogout = () => {} }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click — standard dropdown behavior
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="w-9 h-9 rounded-full bg-brand text-white text-sm font-medium flex items-center justify-center hover:opacity-90 transition-opacity"
      >
        {initials || "?"}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 bg-panel border border-line rounded shadow-lg py-1 z-20"
        >
          <div className="px-4 py-2 text-sm text-muted border-b border-line">{userName}</div>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate(customerPath("/profile"));
            }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors"
          >
            View profile
          </button>
          <button role="menuitem" className="w-full text-left px-4 py-2 text-sm hover:bg-canvas transition-colors">
            Settings
          </button>
          <button
            role="menuitem"
            onClick={onLogout}
            className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger-soft transition-colors"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
