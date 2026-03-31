/**
 * Lightweight in-memory TTL cache with in-flight request deduplication.
 *
 * - Backed by a Map so there is zero setup and no external dependency.
 * - Lives for the duration of the browser session (cleared on hard refresh).
 * - Each entry stores the value + an expiry timestamp.
 * - In-flight map prevents duplicate network requests for the same key.
 *
 * Recommended TTLs (exported as constants so callers stay consistent):
 *   ANALYTICS_TTL  – 5 minutes  (dashboard charts / KPIs)
 *   PROFILE_TTL    – 30 minutes (user profile + business list)
 *   CALENDAR_TTL   – 2 minutes  (calendar posts)
 *   MEDIA_TTL      – 2 minutes  (media library)
 */

export const ANALYTICS_TTL = 5 * 60 * 1000;   // 5 min in ms
export const PROFILE_TTL   = 30 * 60 * 1000;  // 30 min in ms
export const CALENDAR_TTL  = 2 * 60 * 1000;   // 2 min in ms
export const MEDIA_TTL     = 2 * 60 * 1000;   // 2 min in ms

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/** Tracks promises for requests that are currently in-flight. */
const inflight = new Map<string, Promise<unknown>>();

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
 * Removes all entries whose key starts with `prefix`.
 * Useful for invalidating all cached data for a business after a mutation.
 */
export function cacheInvalidate(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Wipes the entire cache. Call on logout so stale data from one
 * user session is never shown after a subsequent login.
 */
export function cacheClear(): void {
  cache.clear();
  inflight.clear();
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

/**
 * Read-through cache with in-flight deduplication.
 *
 * 1. If a fresh entry exists in cache, return it immediately.
 * 2. If an identical request is already in-flight, piggyback on that promise.
 * 3. Otherwise fire the request, cache the result, and return it.
 */
export async function cached<T>(key: string, fn: () => Promise<T>, ttlMs = ANALYTICS_TTL): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fn().then((value) => {
    cacheSet(key, value, ttlMs);
    inflight.delete(key);
    return value;
  }).catch((err) => {
    inflight.delete(key);
    throw err;
  });

  inflight.set(key, promise);
  return promise;
}
