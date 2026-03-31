from app.models.onboarding import OnboardingRequest, OnboardingResponse
from app.models.user import UserProfileUpdate
from app.models.business import BusinessCreate
from app.services.user_service import UserService, get_user_service
from app.services.business_service import BusinessService, get_business_service


class OnboardingService:

    def __init__(self):
        self.user_service: UserService = get_user_service()
        self.business_service: BusinessService = get_business_service()

    def complete_onboarding(self, user_id: str, data: OnboardingRequest) -> OnboardingResponse:
        if data.user:
            self.user_service.update_profile(
                user_id,
                UserProfileUpdate(
                    first_name=data.user.first_name,
                    last_name=data.user.last_name,
                    phone=data.user.phone,
                ),
            )

        business = self.business_service.create_business(
            user_id,
            BusinessCreate(
                name=data.business.name,
                business_type=data.business.business_type,
                description=data.business.description,
                brand_color=data.business.brand_color,
                b2b_or_b2c=data.business.b2b_or_b2c,
                website_url=data.business.website_url,
                instagram_handle=data.business.instagram_handle,
                target_location=data.business.target_location,
                ideal_customer=data.business.ideal_customer,
                products_services=data.business.products_services,
                industry_niche=data.business.industry_niche,
            ),
        )

        if data.plan_id:
            self.user_service.update_profile(
                user_id,
                UserProfileUpdate(plan=data.plan_id),
            )

        return OnboardingResponse(
            user_id=user_id,
            business_id=business.id,
            plan_id=data.plan_id,
        )


def get_onboarding_service() -> OnboardingService:
    return OnboardingService()
