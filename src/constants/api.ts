export const API_TIMEOUT_MS = 10000;

export const AUTH_EXEMPT_PATH_PREFIXES = [
  "/auth/login",
  "/auth/signup",
  "/auth/google",
  "/auth/google/signup",
] as const;
