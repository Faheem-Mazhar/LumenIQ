from pydantic import BaseModel


class OnboardingUserData(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None


class OnboardingBusinessData(BaseModel):
    name: str
    business_format: str | None = None
    description: str | None = None
    brand_color: str | None = None
    b2b_or_b2c: str | None = None
    website_url: str | None = None
    instagram_handle: str | None = None
    target_location: str | None = None
    ideal_customer: str | None = None
    products_services: str | None = None
    industry_niche: str | None = None


class OnboardingRequest(BaseModel):
    user: OnboardingUserData | None = None
    business: OnboardingBusinessData
    plan_id: str | None = None


class OnboardingResponse(BaseModel):
    user_id: str
    business_id: str
    plan_id: str | None = None
    message: str = "Onboarding completed successfully"
