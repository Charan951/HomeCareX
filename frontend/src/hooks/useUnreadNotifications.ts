import { NOTIFICATIONS } from "@/mocks/customerMockData";

/** Unread notification count. MOCK: swap for the notifications API later. */
export function useUnreadNotifications(): number {
  return NOTIFICATIONS.filter((n) => !n.read).length;
}
