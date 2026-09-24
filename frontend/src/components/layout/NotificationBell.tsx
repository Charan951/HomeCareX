interface NotificationBellProps {
  count?: number;
  onClick?: () => void;
}

/**
 * NotificationBell — a "slot" component: it owns its own icon/badge UI and an
 * onClick hook, but has no opinion about where notifications come from. Wire
 * it up to a real feed (Socket.IO / polling / the `notifications` collection)
 * in a later task; for now it renders count=0 and a no-op click handler by
 * default so CustomerLayout has something concrete to mount.
 */
export default function NotificationBell({ count = 0, onClick = () => {} }: NotificationBellProps) {
  return (
    <button
      onClick={onClick}
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className="relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {count > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] leading-4 text-center font-medium">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
