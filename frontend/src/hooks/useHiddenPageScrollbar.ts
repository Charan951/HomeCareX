import { useEffect } from "react";
import { NO_SCROLLBAR } from "@/components/customer/noScrollbar";

/**
 * Hides the browser's page scrollbar while the customer area is mounted (the page still
 * scrolls with wheel / touch / keyboard). Applied to <html> and removed on unmount, so
 * admin and public pages keep their normal scrollbar.
 */
export function useHiddenPageScrollbar(): void {
  useEffect(() => {
    const classes = NO_SCROLLBAR.split(" ");
    const html = document.documentElement;
    html.classList.add(...classes);
    return () => html.classList.remove(...classes);
  }, []);
}
