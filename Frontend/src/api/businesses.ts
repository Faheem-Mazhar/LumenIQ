import { api } from './client';
import type { BusinessCreate, BusinessUpdate } from '../types/business';

interface BusinessResponse {
  id: string;
  user_id: string;
  name: string | null;
  business_format: string | null;
  business_type: string | null;
  city: string | null;
  country: string | null;
  instagram_handle: string | null;
  website_url: string | null;
  description: string | null;
  brand_color: string | null;
  ideal_customer: string | null;
  onboarding_json: Record<string, unknown>;
  created_at: string | null;
  updated_at: string | null;
}

interface BusinessSummaryResponse {
  id: string;
  name: string | null;
  business_format: string | null;
  business_type: string | null;
  city: string | null;
  country: string | null;
  instagram_handle: string | null;
  description: string | null;
}

export function mapBusinessToFrontend(b: BusinessSummaryResponse | BusinessResponse) {
  const location =
    'target_location' in b && b.target_location
      ? b.target_location
      : [b.city, b.country].filter(Boolean).join(', ');

  return {
    id: b.id,
    name: b.name ?? '',
    description: b.description ?? '',
    websiteUrl: 'website_url' in b ? (b.website_url ?? '') : '',
    instagramHandle: b.instagram_handle ?? '',
    brandColor: b.brand_color ?? '#3b82f6',
    location,
    isActive: false,
  };
}

export const businessApi = {
  list: () =>
    api.get<BusinessSummaryResponse[]>('/businesses/'),

  create: (data: BusinessCreate) =>
    api.post<BusinessResponse>('/businesses/', data),

  update: (businessId: string, data: BusinessUpdate) =>
    api.patch<BusinessResponse>(`/businesses/${businessId}`, data),

  // get() and delete() removed — corresponding backend routes are disabled.
  // Re-add when a business detail / deletion UI is built.
};
