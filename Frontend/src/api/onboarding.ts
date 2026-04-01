import { api } from './client';

interface OnboardingUserPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

interface OnboardingBusinessPayload {
  name: string;
  business_format?: string;
  description?: string;
  brand_color?: string;
  b2b_or_b2c?: string;
  website_url?: string;
  instagram_handle?: string;
  target_location?: string;
  ideal_customer?: string;
  products_services?: string;
  industry_niche?: string;
}

interface OnboardingPayload {
  user?: OnboardingUserPayload;
  business: OnboardingBusinessPayload;
  plan_id?: string;
}

interface OnboardingResponse {
  user_id: string;
  business_id: string;
  plan_id?: string;
  message: string;
}

export const onboardingApi = {
  complete: (data: OnboardingPayload) =>
    api.post<OnboardingResponse>('/onboarding/', data),
};
