import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  theme: 'light' | 'dark';
}

export const useUIStore = create<UIState>(() => ({
  isSidebarOpen: true,
  theme: 'light',
}));
