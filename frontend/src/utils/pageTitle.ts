const TITLES: Record<string, string> = {
  "/": "Overview",
  "/addresses": "Customer Dashboard",
  "/bookings": "Customer Dashboard",
  "/categories": "Customer Dashboard",
  "/notifications": "Customer Dashboard",
  "/payments": "Customer Dashboard",
  "/profile": "Customer Dashboard",
  "/referrals": "Customer Dashboard",
  "/reviews": "Customer Dashboard",
  "/services": "Customer Dashboard",
  "/support": "Customer Dashboard",
  "/tracking": "Customer Dashboard",
  "/wallet": "Customer Dashboard",
};

/** Maps the current pathname to a human-readable page title for the TopBar. */
export function getPageTitle(rawPath: string): string {
  const pathname = rawPath.replace(/^\/customer/, "") || "/";
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/bookings/")) return "CustomerDashboard";
  return "HomeCareX";
}
