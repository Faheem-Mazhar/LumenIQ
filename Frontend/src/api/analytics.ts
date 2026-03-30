import { api } from './client';
import { cacheGet, cacheSet, cacheKey, ANALYTICS_TTL } from './cache';
import type {
  KpiItem,
  AudienceDataPoint,
  EngagementDataPoint,
  PlatformItem,
  TopPost,
  ActivityItem,
} from '../types/analytics';

/**
 * Wraps an API call with a read-through cache.
 * If a fresh entry exists in the in-memory cache it is returned immediately
 * without hitting the network. Otherwise the request fires, and the result
 * is stored for `ttlMs` milliseconds before the next caller re-fetches.
 */
async function cached<T>(key: string, fn: () => Promise<T>, ttlMs = ANALYTICS_TTL): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;

  const value = await fn();
  cacheSet(key, value, ttlMs);
  return value;
}

export const analyticsApi = {
  getKpis: (businessId: string, range: string) =>
    cached(
      cacheKey('kpis', businessId, range),
      () => api.get<KpiItem[]>(`/businesses/${businessId}/analytics/kpis?range=${range}`),
    ),

  getAudience: (businessId: string, range: string) =>
    cached(
      cacheKey('audience', businessId, range),
      () => api.get<AudienceDataPoint[]>(`/businesses/${businessId}/analytics/audience?range=${range}`),
    ),

  getEngagement: (businessId: string, range: string) =>
    cached(
      cacheKey('engagement', businessId, range),
      () => api.get<EngagementDataPoint[]>(`/businesses/${businessId}/analytics/engagement?range=${range}`),
    ),

  getPlatforms: (businessId: string) =>
    cached(
      cacheKey('platforms', businessId),
      () => api.get<PlatformItem[]>(`/businesses/${businessId}/analytics/platforms`),
    ),

  getTopPosts: (businessId: string, range: string) =>
    cached(
      cacheKey('top-posts', businessId, range),
      () => api.get<TopPost[]>(`/businesses/${businessId}/analytics/top-posts?range=${range}`),
    ),

  getActivity: (businessId: string, limit = 10) =>
    cached(
      cacheKey('activity', businessId),
      () => api.get<ActivityItem[]>(`/businesses/${businessId}/analytics/activity?limit=${limit}`),
    ),
};
