import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: null | Record<string, unknown>;
}

export const useAuthStore = create<AuthState>(() => ({
  isAuthenticated: false,
  user: null,
}));
