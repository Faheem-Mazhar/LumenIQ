const TOKEN_KEY = 'lumeniq_token';
const REFRESH_TOKEN_KEY = 'lumeniq_refresh_token';

export interface PersistedSession {
  token: string;
  refreshToken: string;
}

/**
 * Writes access + refresh tokens to localStorage so the session
 * survives page refreshes and tab closes.
 */
export function persistSession(token: string, refreshToken: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    // localStorage may be unavailable in private-browsing or storage-quota scenarios
  }
}

/**
 * Reads persisted tokens from localStorage.
 * Returns null when no valid session exists.
 */
export function loadSession(): PersistedSession | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (token && refreshToken) {
      return { token, refreshToken };
    }
  } catch {
    // localStorage may be unavailable
  }
  return null;
}

/**
 * Removes all lumeniq_ keys from localStorage.
 * Called on logout or when a refresh attempt fails.
 */
export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // localStorage may be unavailable
  }
}
