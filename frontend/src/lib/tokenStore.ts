let memoryToken: string | null = null;

export const tokenStore = {
  get: (): string | null => {
    if (memoryToken) return memoryToken;
    const stored =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      null;
    if (stored) {
      memoryToken = stored;
      return stored;
    }
    return null;
  },
  set: (token: string | null) => {
    memoryToken = token;
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
    }
  },
  clear: () => {
    memoryToken = null;
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
  },
};

export const SESSION_EXPIRED_EVENT = "auth:session-expired";