// Backend Config: environment
// Getters read process.env lazily because dotenv.config() runs after the app modules are imported.
export const environmentConfig = {
  get nodeEnv(): string {
    return process.env.NODE_ENV ?? 'development';
  },
  get jwtSecret(): string | undefined {
    return process.env.JWT_SECRET || undefined;
  },
  get redisUrl(): string | undefined {
    return process.env.REDIS_URL || undefined;
  },
};
