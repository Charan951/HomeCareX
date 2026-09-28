import { useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { getPageTitle } from "../../utils/pageTitle";
import { customerPath } from "@/routes/customerPath";

interface TopBarProps {
  userName?: string;
  notificationCount?: number;
  onLogout?: () => void;
}

export default function TopBar({ userName, notificationCount = 0, onLogout }: TopBarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = getPageTitle(pathname);

  return (
    <header className="hidden md:flex items-center justify-between h-16 px-8 border-b border-line bg-panel sticky top-0 z-10">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <NotificationBell count={notificationCount} onClick={() => navigate(customerPath("/notifications"))} />
        <ProfileMenu userName={userName} onLogout={onLogout} />
      </div>
    </header>
  );
}
