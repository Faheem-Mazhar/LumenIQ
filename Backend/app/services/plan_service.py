from app.models.plan import PlanOption, PlanStream

PLAN_CATALOG: list[PlanStream] = [
    PlanStream(
        id="digital",
        title="Stream A",
        subtitle="Digital businesses",
        plans=[
            PlanOption(
                id="digital-solo",
                name="Solo",
                price_label="$39/mo",
                features=[
                    "1 brand",
                    "product pull (basic)",
                    "monthly auto-planner",
                    "tap-to-publish + reminders",
                    "essentials analytics (90-day)",
                ],
            ),
            PlanOption(
                id="digital-starter",
                name="Starter",
                price_label="$79/mo",
                features=[
                    "2 brands",
                    "product sync + SKU tags",
                    "2 auto-planners/mo",
                    "A/B hooks & captions",
                    "3-month analytics + exports",
                    "basic approvals",
                ],
            ),
            PlanOption(
                id="digital-growth",
                name="Growth",
                price_label="$139/mo",
                features=[
                    "5 brands",
                    "UTM/GA merge dashboard",
                    "seasonal templates",
                    "bulk scheduling (CSV)",
                    "asset library",
                    "review-mining prompts",
                    "12-month analytics + PDF/CSV",
                ],
            ),
            PlanOption(
                id="digital-enterprise",
                name="Enterprise",
                price_label="Custom",
                description="Customized based on business profile (5+ brands)",
                is_enterprise=True,
            ),
        ],
    ),
    PlanStream(
        id="physical",
        title="Stream B",
        subtitle="Physical businesses",
        plans=[
            PlanOption(
                id="physical-solo",
                name="Solo",
                price_label="$29/mo",
            ),
            PlanOption(
                id="physical-starter",
                name="Starter",
                price_label="$59/mo",
                features=[
                    "2 brands",
                    "2 auto-planners/mo",
                    "promo/offer & event templates",
                    "basic approvals & activity log",
                    "3-month analytics + exports",
                ],
            ),
            PlanOption(
                id="physical-growth",
                name="Growth",
                price_label="$119/mo",
                features=[
                    "5 brands",
                    "seasonal calendars",
                    "bulk scheduling (CSV)",
                    "asset library",
                    "localization tokens (menu/hours/neighbourhood/class schedule)",
                    "12-month analytics + PDF/CSV",
                ],
            ),
            PlanOption(
                id="physical-enterprise",
                name="Enterprise",
                price_label="Custom",
                description="Customized based on business profile (5+ brands)",
                is_enterprise=True,
            ),
        ],
    ),
]


class PlanService:

    def list_plans(self) -> list[PlanStream]:
        return PLAN_CATALOG


def get_plan_service() -> PlanService:
    return PlanService()
