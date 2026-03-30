from fastapi import APIRouter, Depends

from app.models.business import Business, BusinessCreate, BusinessUpdate, BusinessSummary
from app.services.business_service import BusinessService, get_business_service
from app.dependencies.authentication import get_current_user_id

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.get("/", response_model=list[BusinessSummary])
async def list_businesses(
    user_id: str = Depends(get_current_user_id),
    business_service: BusinessService = Depends(get_business_service),
):
    return business_service.list_businesses_for_user(user_id)


# NOTE: GET /{business_id} has no frontend caller — the frontend uses the
# list endpoint and reads from Redux. Re-enable when a detail page is added.

# @router.get("/{business_id}", response_model=Business)
# async def get_business(
#     business_id: str,
#     user_id: str = Depends(get_current_user_id),
#     business_service: BusinessService = Depends(get_business_service),
# ):
#     return business_service.get_business(business_id, user_id)


@router.post("/", response_model=Business, status_code=201)
async def create_business(
    business_data: BusinessCreate,
    user_id: str = Depends(get_current_user_id),
    business_service: BusinessService = Depends(get_business_service),
):
    return business_service.create_business(user_id, business_data)


@router.patch("/{business_id}", response_model=Business)
async def update_business(
    business_id: str,
    updates: BusinessUpdate,
    user_id: str = Depends(get_current_user_id),
    business_service: BusinessService = Depends(get_business_service),
):
    return business_service.update_business(business_id, user_id, updates)


# NOTE: DELETE /{business_id} has no frontend caller. Re-enable when a
# business-management / danger-zone UI is added to SettingsPage.

# @router.delete("/{business_id}", status_code=204)
# async def delete_business(
#     business_id: str,
#     user_id: str = Depends(get_current_user_id),
#     business_service: BusinessService = Depends(get_business_service),
# ):
#     business_service.delete_business(business_id, user_id)
