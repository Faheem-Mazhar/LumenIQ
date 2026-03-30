from fastapi import APIRouter, Depends

from app.models.payment import (
    Payment,
    CreateCheckoutSessionRequest,
    CreateCheckoutSessionResponse,
    CustomerPortalRequest,
    CustomerPortalResponse,
)
from app.services.payment_service import PaymentService, get_payment_service
from app.services.stripe_service import StripeService, get_stripe_service
from app.dependencies.authentication import get_current_user_id

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/history", response_model=list[Payment])
async def list_payment_history(
    user_id: str = Depends(get_current_user_id),
    payment_service: PaymentService = Depends(get_payment_service),
):
    return payment_service.list_payments_for_user(user_id)


# NOTE: GET /{payment_id} has no frontend caller. Re-enable when a
# payment-detail / receipt page is added.

# @router.get("/{payment_id}", response_model=Payment)
# async def get_payment(
#     payment_id: str,
#     user_id: str = Depends(get_current_user_id),
#     payment_service: PaymentService = Depends(get_payment_service),
# ):
#     return payment_service.get_payment(payment_id)


@router.post("/checkout", response_model=CreateCheckoutSessionResponse)
async def create_checkout_session(
    request_body: CreateCheckoutSessionRequest,
    user_id: str = Depends(get_current_user_id),
    stripe_service: StripeService = Depends(get_stripe_service),
):
    result = stripe_service.create_checkout_session(
        user_id=user_id,
        price_id=request_body.price_id,
        success_url=request_body.success_url,
        cancel_url=request_body.cancel_url,
    )
    return CreateCheckoutSessionResponse(**result)


@router.post("/customer-portal", response_model=CustomerPortalResponse)
async def create_customer_portal_session(
    request_body: CustomerPortalRequest,
    user_id: str = Depends(get_current_user_id),
    stripe_service: StripeService = Depends(get_stripe_service),
):
    result = stripe_service.create_customer_portal_session(
        user_id=user_id,
        return_url=request_body.return_url,
    )
    return CustomerPortalResponse(**result)
