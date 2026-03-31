import stripe

from app.core.configuration import settings
from app.core.exceptions import ExternalServiceError, NotFoundError
from app.services.user_service import get_user_service
from app.services.payment_service import get_payment_service
from app.models.payment import PaymentCreate

stripe.api_key = settings.stripe_secret_key


class StripeService:

    def __init__(self):
        self.user_service = get_user_service()
        self.payment_service = get_payment_service()

    def create_checkout_session(self, user_id: str, plan_id: str, success_url: str, cancel_url: str) -> dict:
        try:
            profile = self.user_service.get_profile(user_id)
            customer_id = profile.stripe_customer_id

            if not customer_id:
                customer = stripe.Customer.create(metadata={"user_id": user_id})
                customer_id = customer.id
                from app.models.user import UserProfileUpdate
                self.user_service.update_profile(
                    user_id,
                    UserProfileUpdate(stripe_customer_id=customer_id),  # type: ignore[call-arg]
                )

            from app.services.plan_service import get_plan_service
            plan_service = get_plan_service()
            plan_catalog = plan_service.list_plans()
            
            target_plan = None
            for stream in plan_catalog:
                for p in stream.plans:
                    if p.id == plan_id:
                        target_plan = p
                        break
                if target_plan:
                    break
            
            if not target_plan:
                raise NotFoundError("Plan", plan_id)

            # E.g. price_label = "$39/mo" -> parse to 3900 cents
            price_str = target_plan.price_label.replace('$', '').replace('/mo', '').strip()
            if price_str.lower() == 'custom':
                unit_amount = 0
            else:
                unit_amount = int(float(price_str) * 100)

            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "cad",
                        "product_data": {
                            "name": f"LumenIQ {target_plan.name}",
                        },
                        "unit_amount": unit_amount,
                        "recurring": {"interval": "month"}
                    },
                    "quantity": 1
                }],
                mode="subscription",
                success_url=success_url,
                cancel_url=cancel_url,
                metadata={"user_id": user_id, "plan_id": plan_id},
            )

            return {
                "checkout_session_id": session.id,
                "checkout_url": session.url,
            }
        except stripe.error.StripeError as e:
            raise ExternalServiceError("Stripe", str(e)) from e
        except NotFoundError:
            raise
        except Exception as error:
            raise ExternalServiceError("Stripe", str(error)) from error

    def verify_checkout_session(self, user_id: str, session_id: str) -> dict:
        try:
            session = stripe.checkout.Session.retrieve(
                session_id,
                expand=["payment_intent", "subscription", "line_items"]
            )

            if session.payment_status != "paid":
                return {"success": False, "plan_id": None}

            plan_id = getattr(session.metadata, "plan_id", None) if session.metadata else None


            try:
                payment_intent_id = ""
                if session.payment_intent:
                    if isinstance(session.payment_intent, str):
                        payment_intent_id = session.payment_intent
                    else:
                        payment_intent_id = getattr(session.payment_intent, "id", "")
                        

                if not payment_intent_id:
                    invoice = getattr(session, "invoice", None)
                    if invoice:
                        payment_intent_id = invoice if isinstance(invoice, str) else getattr(invoice, "id", "")
                    

                if not payment_intent_id:
                    payment_intent_id = session.id

                subscription_id = None
                if session.subscription:
                    if isinstance(session.subscription, str):
                        subscription_id = session.subscription
                    else:
                        subscription_id = getattr(session.subscription, "id", None)


                if plan_id:
                    admin_client = self.user_service.admin_client
                    admin_client.table("profiles").update({"plan": plan_id}).eq("user_id", user_id).execute()


                existing = self.payment_service.admin_client.table("payments").select("id").eq("stripe_payment_intent_id", payment_intent_id).execute()
                if not existing.data:
                    from app.models.payment import PaymentCreate
                    self.payment_service.record_payment(
                        user_id=user_id,
                        payment_data=PaymentCreate(
                            stripe_payment_intent_id=payment_intent_id,
                            stripe_subscription_id=subscription_id,
                            amount=session.amount_total or 0,
                            currency=session.currency or "cad",
                            status="paid",
                            metadata={"checkout_session_id": session.id},
                            plan=plan_id
                        ),
                    )
            except Exception as e:
                print(f"Error recording verified payment: {e}")

            return {"success": True, "plan_id": plan_id}
        except stripe.error.StripeError as e:
            raise ExternalServiceError("Stripe", str(e)) from e
        except Exception as error:
            raise ExternalServiceError("Stripe", str(error)) from error

    def create_customer_portal_session(self, user_id: str, return_url: str) -> dict:
        try:
            profile = self.user_service.get_profile(user_id)

            if not profile.stripe_customer_id:
                raise NotFoundError("Stripe customer", user_id)

            session = stripe.billing_portal.Session.create(
                customer=profile.stripe_customer_id,
                return_url=return_url,
            )

            return {"portal_url": session.url}
        except NotFoundError:
            raise
        except Exception as error:
            raise ExternalServiceError("Stripe", str(error)) from error

    def handle_webhook_event(self, payload: bytes, signature: str) -> dict:
        try:
            event = stripe.Webhook.construct_event(
                payload, signature, settings.stripe_webhook_secret
            )
        except stripe.error.SignatureVerificationError as error:
            raise ExternalServiceError("Stripe Webhook", "Invalid signature") from error

        event_type = event["type"]
        event_data = event["data"]["object"]

        if event_type == "checkout.session.completed":
            self._handle_checkout_completed(event_data)
        elif event_type == "invoice.payment_succeeded":
            self._handle_invoice_paid(event_data)
        elif event_type == "customer.subscription.updated":
            self._handle_subscription_updated(event_data)
        elif event_type == "customer.subscription.deleted":
            self._handle_subscription_deleted(event_data)

        return {"event_type": event_type, "processed": True}

    def _handle_checkout_completed(self, session_data: dict) -> None:
        user_id = session_data.get("metadata", {}).get("user_id")
        if not user_id:
            return

        subscription_id = session_data.get("subscription")
        payment_intent_id = session_data.get("payment_intent", subscription_id or "unknown")

        self.payment_service.record_payment(
            user_id=user_id,
            payment_data=PaymentCreate(
                stripe_payment_intent_id=payment_intent_id,
                stripe_subscription_id=subscription_id,
                amount=session_data.get("amount_total", 0),
                currency=session_data.get("currency", "cad"),
                status="completed",
                metadata={"session_id": session_data.get("id")},
            ),
        )

    def _handle_invoice_paid(self, invoice_data: dict) -> None:
        customer_id = invoice_data.get("customer")
        if not customer_id:
            return

        subscription_id = invoice_data.get("subscription")
        payment_intent_id = invoice_data.get("payment_intent", "unknown")


        try:
            admin_client = self.user_service.admin_client
            response = (
                admin_client.table("profiles")
                .select("user_id")
                .eq("stripe_customer_id", customer_id)
                .single()
                .execute()
            )
            user_id = response.data["user_id"]

            self.payment_service.record_payment(
                user_id=user_id,
                payment_data=PaymentCreate(
                    stripe_payment_intent_id=payment_intent_id,
                    stripe_subscription_id=subscription_id,
                    amount=invoice_data.get("amount_paid", 0),
                    currency=invoice_data.get("currency", "cad"),
                    status="paid",
                    metadata={"invoice_id": invoice_data.get("id")},
                ),
            )
        except Exception:
            pass

    def _handle_subscription_updated(self, subscription_data: dict) -> None:
        customer_id = subscription_data.get("customer")
        if not customer_id:
            return

        plan_name = self._extract_plan_name(subscription_data)

        try:
            admin_client = self.user_service.admin_client
            response = (
                admin_client.table("profiles")
                .select("user_id")
                .eq("stripe_customer_id", customer_id)
                .single()
                .execute()
            )
            user_id = response.data["user_id"]


            admin_client.table("profiles").update({"plan": plan_name}).eq("user_id", user_id).execute()
        except Exception:
            pass

    def _handle_subscription_deleted(self, subscription_data: dict) -> None:
        customer_id = subscription_data.get("customer")
        if not customer_id:
            return

        try:
            admin_client = self.user_service.admin_client
            response = (
                admin_client.table("profiles")
                .select("user_id")
                .eq("stripe_customer_id", customer_id)
                .single()
                .execute()
            )
            user_id = response.data["user_id"]

            admin_client.table("profiles").update({"plan": "free"}).eq("user_id", user_id).execute()
        except Exception:
            pass

    def _extract_plan_name(self, subscription_data: dict) -> str:
        items = subscription_data.get("items", {}).get("data", [])
        if items:
            price = items[0].get("price", {})
            return price.get("lookup_key", price.get("nickname", "pro"))
        return "pro"


def get_stripe_service() -> StripeService:
    return StripeService()
