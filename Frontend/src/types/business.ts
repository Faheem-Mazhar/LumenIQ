export interface Business {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  instagramHandle: string;
  brandColor: string;
  location: string;
  isActive: boolean;
}

export interface BusinessCreate {
  name: string;
  business_format?: string;
  business_type?: string;
  city?: string;
  country?: string;
  instagram_handle?: string;
  website_url?: string;
  ideal_customer?: string;
  description?: string;
  brand_color?: string;
  b2b_or_b2c?: string;
  target_location?: string;
  products_services?: string;
  industry_niche?: string;
}

export interface BusinessUpdate {
  name?: string;
  business_format?: string;
  business_type?: string;
  city?: string;
  country?: string;
  instagram_handle?: string;
  website_url?: string;
  ideal_customer?: string;
  description?: string;
  brand_color?: string;
  b2b_or_b2c?: string;
  target_location?: string;
  products_services?: string;
  industry_niche?: string;
}

export interface BusinessSummary {
  id: string;
  name?: string;
  business_format?: string;
  business_type?: string;
  city?: string;
  country?: string;
  instagram_handle?: string;
  description?: string;
}

export function mapBusinessSummaryToFrontend(summary: BusinessSummary): Business {
  return {
    id: summary.id,
    name: summary.name ?? '',
    description: summary.description ?? '',
    websiteUrl: '',
    instagramHandle: summary.instagram_handle ?? '',
    brandColor: summary.brand_color ?? '#3b82f6',
    location: [summary.city, summary.country].filter(Boolean).join(', '),
    isActive: false,
  };
}
