from datetime import datetime
from typing import Any
from pydantic import BaseModel


class PaymentCreate(BaseModel):
    stripe_payment_intent_id: str
    stripe_subscription_id: str | None = None
    amount: int
    currency: str = "cad"
    status: str
    plan: str | None = None
    period_start: datetime | None = None
    period_end: datetime | None = None
    metadata: dict[str, Any] = {}


class Payment(BaseModel):
    id: str
    user_id: str
    stripe_payment_intent_id: str
    stripe_subscription_id: str | None = None
    amount: int
    currency: str = "cad"
    status: str
    plan: str | None = None
    period_start: datetime | None = None
    period_end: datetime | None = None
    metadata: dict[str, Any] = {}
    created_at: datetime | None = None


class CreateCheckoutSessionRequest(BaseModel):
    plan_id: str
    success_url: str
    cancel_url: str


class CreateCheckoutSessionResponse(BaseModel):
    checkout_session_id: str
    checkout_url: str


class CustomerPortalRequest(BaseModel):
    return_url: str


class CustomerPortalResponse(BaseModel):
    portal_url: str


class VerifyCheckoutSessionRequest(BaseModel):
    session_id: str


class VerifyCheckoutSessionResponse(BaseModel):
    success: bool
    plan_id: str | None = None
