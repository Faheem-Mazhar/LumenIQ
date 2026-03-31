import { api } from './client';
import { cached, cacheKey, cacheInvalidate, CALENDAR_TTL } from './cache';
import type { CalendarPostAPI } from '../types/calendar';

interface CreatePostPayload {
  caption?: string;
  media?: string[];
  scheduled_at?: string;
  status?: string;
  post_type?: string;
  platform?: string;
}

interface UpdatePostPayload {
  caption?: string;
  media?: string[];
  scheduled_at?: string | null;
  status?: string;
  post_type?: string;
  platform?: string;
}

export const calendarApi = {
  listPosts: (businessId: string, calendarId?: string, status?: string) => {
    const suffix = [calendarId, status].filter(Boolean).join(':') || undefined;
    return cached(
      cacheKey('calendar-posts', businessId, suffix),
      () => {
        const params = new URLSearchParams();
        if (calendarId) params.set('calendar_id', calendarId);
        if (status) params.set('status', status);
        const qs = params.toString();
        return api.get<CalendarPostAPI[]>(
          `/businesses/${businessId}/calendar/posts${qs ? `?${qs}` : ''}`,
        );
      },
      CALENDAR_TTL,
    );
  },

  createPost: async (businessId: string, data: CreatePostPayload) => {
    const result = await api.post<CalendarPostAPI>(`/businesses/${businessId}/calendar/posts`, data);
    cacheInvalidate(`calendar-posts:${businessId}`);
    return result;
  },

  updatePost: async (businessId: string, postId: string, data: UpdatePostPayload) => {
    const result = await api.patch<CalendarPostAPI>(`/businesses/${businessId}/calendar/posts/${postId}`, data);
    cacheInvalidate(`calendar-posts:${businessId}`);
    return result;
  },

  deletePost: async (businessId: string, postId: string) => {
    const result = await api.delete(`/businesses/${businessId}/calendar/posts/${postId}`);
    cacheInvalidate(`calendar-posts:${businessId}`);
    return result;
  },
};
