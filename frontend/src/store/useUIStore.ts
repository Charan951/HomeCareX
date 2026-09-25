import { create } from 'zustand';

interface UIState {
  // Desktop: true = full sidebar with labels, false = icon-only strip
  isSidebarCollapsed: boolean;
  // Mobile: true = the sidebar drawer is slid open over the page
  isMobileMenuOpen: boolean;
  theme: 'light' | 'dark';

  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  theme: 'light',

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
}));