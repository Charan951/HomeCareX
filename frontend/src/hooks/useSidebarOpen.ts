import { useCallback, useState } from "react";

const STORAGE_KEY = "customer:sidebar-open";

/** Desktop sidebar open/closed, remembered between visits (falls back to open if storage is unavailable). */
export function useSidebarOpen(storageKey: string = STORAGE_KEY): [boolean, () => void] {
  const [open, setOpen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(storageKey) !== "0";
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {
        /* storage blocked (private mode) — the toggle still works for this session */
      }
      return next;
    });
  }, [storageKey]);

  return [open, toggle];
}