/**
 * Lightweight in-memory TTL cache.
 *
 * - Backed by a Map so there is zero setup and no external dependency.
 * - Lives for the duration of the browser session (cleared on hard refresh).
 * - Each entry stores the value + an expiry timestamp.
 *
 * Recommended TTLs (exported as constants so callers stay consistent):
 *   ANALYTICS_TTL  – 5 minutes  (dashboard charts / KPIs)
 *   PROFILE_TTL    – 30 minutes (user profile + business list)
 */

export const ANALYTICS_TTL = 5 * 60 * 1000;   // 5 min in ms
export const PROFILE_TTL   = 30 * 60 * 1000;  // 30 min in ms

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Returns the cached value for `key` if it exists and has not expired.
 * Returns `null` on a miss or a stale entry (stale entries are evicted).
 */
export function cacheGet<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Stores `value` under `key` with a TTL of `ttlMs` milliseconds.
 */
export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Removes a single entry. Useful when you know data has changed
 * (e.g. after creating or deleting a post).
 */
export function cacheDelete(key: string): void {
  cache.delete(key);
}

/**
 * Wipes the entire cache. Call on logout so stale data from one
 * user session is never shown after a subsequent login.
 */
export function cacheClear(): void {
  cache.clear();
}

/**
 * Builds a canonical cache key that incorporates all dimensions
 * that affect the response (endpoint, business, time range).
 *
 * Examples:
 *   cacheKey('kpis', 'biz-123', '7D')     → 'kpis:biz-123:7D'
 *   cacheKey('platforms', 'biz-123')       → 'platforms:biz-123'
 */
export function cacheKey(endpoint: string, businessId: string, range?: string): string {
  return range ? `${endpoint}:${businessId}:${range}` : `${endpoint}:${businessId}`;
}
