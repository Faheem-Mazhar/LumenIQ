import { api, refreshAuth } from './client';
import { cached, cacheKey, cacheDelete, MEDIA_TTL } from './cache';
import { store } from '../auth/store';
import { logout } from '../auth/store/authSlice';
import type { Photo } from '../types/photo';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export interface BusinessMediaResponse {
  id: string;
  business_id: string;
  file_url: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  tags: string[];
  created_at: string | null;
}

export function mapMediaToPhoto(media: BusinessMediaResponse): Photo {
  return {
    id: media.id,
    title: media.file_name ?? 'Untitled',
    url: media.file_url,
    createdDate: media.created_at ? new Date(media.created_at) : new Date(),
    isAIGenerated: false,
    tags: media.tags ?? [],
    usedInPosts: 0,
  };
}

export const mediaApi = {
  list: (businessId: string) =>
    cached(
      cacheKey('media', businessId),
      () => api.get<BusinessMediaResponse[]>(`/businesses/${businessId}/media`),
      MEDIA_TTL,
    ),

  upload: async (businessId: string, file: File): Promise<BusinessMediaResponse> => {
    // File uploads must use raw fetch (FormData is incompatible with the
    // JSON-only api.* helpers), so we replicate the refresh-then-retry logic
    // here using the shared refreshAuth() helper from client.ts.
    async function attemptUpload(isRetry = false): Promise<Response> {
      const token = store.getState().auth.token;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/businesses/${businessId}/media/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.status === 401 && !isRetry) {
        try {
          await refreshAuth();
          return attemptUpload(true);
        } catch {
          store.dispatch(logout());
          throw new Error('Session expired. Please sign in again.');
        }
      }

      return response;
    }

    const response = await attemptUpload();

    if (response.status === 401) {
      store.dispatch(logout());
      throw new Error('Session expired. Please sign in again.');
    }

    if (!response.ok) {
      let detail = 'Upload failed';
      try {
        const body = await response.json();
        detail = body.detail || detail;
      } catch { /* response wasn't JSON */ }
      throw new Error(detail);
    }

    const data: BusinessMediaResponse = await response.json();
    cacheDelete(cacheKey('media', businessId));
    return data;
  },
};
