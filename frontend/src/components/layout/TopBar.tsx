import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";

interface TopBarProps {
  userName?: string;
  notificationCount?: number;
  onLogout?: () => void;
}

export default function TopBar({ userName, notificationCount = 0, onLogout }: TopBarProps) {
  return (
    <header className="hidden md:flex items-center justify-end gap-3 h-16 px-8 border-b border-line bg-panel sticky top-0 z-10">
      <NotificationBell count={notificationCount} />
      <ProfileMenu userName={userName} onLogout={onLogout} />
    </header>
  );
}
