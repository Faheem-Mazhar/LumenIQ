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
from urllib.parse import parse_qs
from http.cookies import SimpleCookie
from typing import Optional
from chainlit.server import app as chainlit_server_app


# In-memory store for query params keyed by user_id, since cross-origin
# iframes block cookies in modern browsers.
_pending_params: dict[str, dict[str, str]] = {}


class QueryParamMiddleware:
    """ASGI middleware that captures user_id and business_id from iframe query
    params and stores them in memory for the auth callback to read."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            query_string = scope.get("query_string", b"").decode()
            params = parse_qs(query_string)
            user_id = params.get("user_id", [None])[0]
            business_id = params.get("business_id", [None])[0]

            if user_id:
                _pending_params[user_id] = {
                    "user_id": user_id,
                    "business_id": business_id or "",
                }

        await self.app(scope, receive, send)


chainlit_server_app.add_middleware(QueryParamMiddleware)


kernel = kernel_init()
manager = ManagerAgent(kernel)
business_profiler_queries = BusinessProfilerQueries()

DEFAULT_USER_ID = ""
DEFAULT_BUSINESS_ID = ""


@cl.header_auth_callback
async def header_auth_callback(headers: dict) -> Optional[cl.User]:
    """Authenticate by reading user_id/business_id from the in-memory store
    (populated by query params), falling back to cookies, and finally to
    the Referer URL query params. Always returns a valid user so the iframe
    never shows a login gate."""
    user_id = DEFAULT_USER_ID
    business_id = DEFAULT_BUSINESS_ID

    # 1. Try cookies (works for same-origin / non-iframe)
    cookie_header = headers.get("cookie", "")
    cookies = SimpleCookie(cookie_header)
    user_id_cookie = cookies.get("cl_user_id")
    business_id_cookie = cookies.get("cl_business_id")
    if user_id_cookie:
        user_id = user_id_cookie.value
        business_id = business_id_cookie.value if business_id_cookie else ""

    # 2. Try Referer URL query params (works for cross-origin iframes)
    referer = headers.get("referer", "")
    if referer and "user_id" in referer:
        try:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            ref_params = parse_qs(parsed.query)
            if ref_params.get("user_id"):
                user_id = ref_params["user_id"][0]
                business_id = ref_params.get("business_id", [""])[0]
        except Exception:
            pass

    # 3. Try in-memory store (populated by middleware on initial page load)
    if user_id and user_id in _pending_params:
        stored = _pending_params[user_id]
        user_id = stored["user_id"]
        business_id = stored["business_id"]

    # Always return a user — real auth is handled by the Frontend (Supabase JWT)
    return cl.User(
        identifier=user_id or "anonymous",
        metadata={"user_id": user_id, "business_id": business_id},
    )


@cl.on_chat_start
async def on_chat_start():

    thread = ChatHistoryAgentThread(chat_history=ChatHistory())
    cl.user_session.set("thread", thread)

    app_user = cl.user_session.get("user")
    user_id = app_user.metadata["user_id"]
    business_id = app_user.metadata["business_id"]

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