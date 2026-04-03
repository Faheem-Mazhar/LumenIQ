import chainlit as cl
from app.config import APP_NAME
from semantic_kernel.contents import ChatHistory
from semantic_kernel.agents import ChatHistoryAgentThread
from app.kernel_config import kernel_init
from app.agents.manager_agent import ManagerAgent
from app.schemas.business_context import BusinessContext
from app.schemas.user_request import UserRequest
from app.db.business_profiler_queries import BusinessProfilerQueries
from app.orchestrator.route_types import RouteType, IntentType
from urllib.parse import parse_qs, urlparse
from typing import Optional
from chainlit.server import app as chainlit_server_app
from starlette.requests import Request
from starlette.responses import JSONResponse


# ── Custom endpoint to receive user context from the Frontend ────────────
# The Frontend posts user_id and business_id here after the iframe loads,
# bypassing cross-origin cookie issues entirely.
_user_context: dict[str, dict[str, str]] = {}


@chainlit_server_app.get("/auth/context")
async def set_user_context(request: Request):
    """Store user context from query params. Called by the iframe URL."""
    user_id = request.query_params.get("user_id", "")
    business_id = request.query_params.get("business_id", "")
    if user_id:
        _user_context[user_id] = {
            "user_id": user_id,
            "business_id": business_id,
        }
    return JSONResponse({"status": "ok"})


# ── Middleware to capture query params from every request ─────────────────
class QueryParamMiddleware:
    """ASGI middleware that captures user_id and business_id from query
    params on any request and stores them for later use."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            query_string = scope.get("query_string", b"").decode()
            params = parse_qs(query_string)
            user_id = params.get("user_id", [None])[0]
            business_id = params.get("business_id", [None])[0]

            if user_id:
                _user_context[user_id] = {
                    "user_id": user_id,
                    "business_id": business_id or "",
                }

        await self.app(scope, receive, send)


chainlit_server_app.add_middleware(QueryParamMiddleware)


# ── Auth callback — always succeeds ──────────────────────────────────────
# Real auth is handled by the Frontend (Supabase JWT). This just extracts
# user context so Chainlit doesn't show a login gate.
@cl.header_auth_callback
async def header_auth_callback(headers: dict) -> Optional[cl.User]:
    user_id = ""
    business_id = ""

    # Try to extract from Referer (the iframe src URL has query params)
    referer = headers.get("referer", "")
    if referer:
        try:
            parsed = urlparse(referer)
            ref_params = parse_qs(parsed.query)
            user_id = ref_params.get("user_id", [""])[0]
            business_id = ref_params.get("business_id", [""])[0]
        except Exception:
            pass

    # Fallback to in-memory store
    if not user_id and _user_context:
        # Get the most recently stored context
        last_key = list(_user_context.keys())[-1]
        user_id = _user_context[last_key]["user_id"]
        business_id = _user_context[last_key]["business_id"]

    # ALWAYS return a user — never None (which triggers login page)
    return cl.User(
        identifier=user_id or "anonymous",
        metadata={"user_id": user_id, "business_id": business_id},
    )


# ── App init ─────────────────────────────────────────────────────────────
kernel = kernel_init()
manager = ManagerAgent(kernel)
business_profiler_queries = BusinessProfilerQueries()


@cl.on_chat_start
async def on_chat_start():

    thread = ChatHistoryAgentThread(chat_history=ChatHistory())
    cl.user_session.set("thread", thread)

    app_user = cl.user_session.get("user")
    user_id = app_user.metadata["user_id"] if app_user else ""
    business_id = app_user.metadata["business_id"] if app_user else ""

    cl.user_session.set("user_id", user_id)
    cl.user_session.set("business_id", business_id)
    cl.user_session.set("pending_route", None)
    cl.user_session.set("pending_pipeline_end_at", None)

    context = business_profiler_queries.get_business_context(user_id, business_id)
    cl.user_session.set("context", context)

    await cl.Message(content = (
        f"Welcome to {APP_NAME}.\n\n"
        "I'm your AI assistant. I can help you create engaging social media content, schedule posts, analyze trends, and manage your social media strategy.\n\n"
        "Your business profile has been set up. Whenever you're ready, let me know would you like to work on today?"
    )).send()

@cl.on_message
async def on_message(message: cl.Message):
    thread = cl.user_session.get("thread")
    user_id = cl.user_session.get("user_id")
    business_id = cl.user_session.get("business_id")
    context = cl.user_session.get("context")
    pending_route = cl.user_session.get("pending_route")
    pending_pipeline_end_at = cl.user_session.get("pending_pipeline_end_at")

    user_input = message.content

    if context is None:
        context = business_profiler_queries.get_business_context(user_id, business_id)
        cl.user_session.set("context", context)

    request = UserRequest(
        user_id=user_id,
        business_id=business_id,
        user_prompt=user_input
    )

    try:
        manager_decision = await manager.run(
            user_request=request,
            business_context=context,
            thread=thread,
            pending_route=pending_route,
            pending_pipeline_end_at=pending_pipeline_end_at
        )

        if manager_decision.route not in [RouteType.UNKNOWN] and manager_decision.intent not in [IntentType.CONFIRM, IntentType.CANCEL]:
            cl.user_session.set("pending_route", manager_decision.route)
            cl.user_session.set("pending_pipeline_end_at", manager_decision.pipeline_end_at)
        elif manager_decision.intent in [IntentType.CANCEL, IntentType.CONFIRM]:
            cl.user_session.set("pending_route", None)
            cl.user_session.set("pending_pipeline_end_at", None)

        context = business_profiler_queries.get_business_context(user_id, business_id)
        cl.user_session.set("context", context)

    except Exception as e:
        await cl.Message(content = "Something went wrong").send()
        raise e
