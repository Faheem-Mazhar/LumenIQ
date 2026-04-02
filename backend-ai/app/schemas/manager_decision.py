from pydantic import BaseModel
from app.orchestrator.route_types import IntentType, RouteType


class ManagerDecision(BaseModel):
    intent: IntentType
    route: RouteType
    target_agent: str
    reason: str
    pipeline_end_at: str
    manager_response: str
