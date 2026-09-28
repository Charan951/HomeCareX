import { useCallback, useState } from "react";

const STORAGE_KEY = "customer:sidebar-open";

/** Desktop sidebar open/closed, remembered between visits (falls back to open if storage is unavailable). */
export function useSidebarOpen(): [boolean, () => void] {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* storage blocked (private mode) — the toggle still works for this session */
      }
      return next;
    });
  }, []);

  return [open, toggle];
}
