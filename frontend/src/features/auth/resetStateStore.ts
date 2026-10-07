/**
 * In-memory temporary store for password reset secrets.
 *
 * SECURITY REQUIREMENT:
 * This state is strictly stored in runtime memory only.
 * NEVER persist to localStorage, sessionStorage, IndexedDB, cookies, or persistent storage.
 */
interface ResetPasswordState {
  email: string;
  resetToken: string | null;
}

let inMemoryState: ResetPasswordState = {
  email: '',
  resetToken: null,
};

export const resetStateStore = {
  getEmail: (): string => inMemoryState.email,
  getResetToken: (): string | null => inMemoryState.resetToken,
  setEmail: (email: string): void => {
    inMemoryState.email = email.trim().toLowerCase();
  },
  setResetToken: (token: string | null): void => {
    inMemoryState.resetToken = token;
  },
  clear: (): void => {
    inMemoryState = {
      email: '',
      resetToken: null,
    };
  },
};

export default resetStateStore;
