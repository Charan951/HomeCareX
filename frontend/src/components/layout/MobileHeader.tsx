import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";

interface MobileHeaderProps {
  userName?: string;
  notificationCount?: number;
  onLogout?: () => void;
}


export default function MobileHeader({ userName, notificationCount = 0, onLogout }: MobileHeaderProps) {
  return (
    <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-line bg-panel sticky top-0 z-10">
      <div className="text-base font-semibold text-brand">HomeCareX</div>
      <div className="flex items-center gap-1">
        <NotificationBell count={notificationCount} />
        <ProfileMenu userName={userName} onLogout={onLogout} />
      </div>
    </header>
  );
}
