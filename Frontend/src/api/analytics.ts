import { api } from './client';
import { cached, cacheKey } from './cache';
import type {
  KpiItem,
  AudienceDataPoint,
  EngagementDataPoint,
  PlatformItem,
  TopPost,
  ActivityItem,
} from '../types/analytics';

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
