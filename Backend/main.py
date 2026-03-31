import os

# ── SSL certificate fix for Python 3.13 on macOS ──────────────────────────────
# Python 3.13 installed from python.org ships with no CA bundle, so every
# outbound TLS connection times out or fails cert verification. Setting these
# environment variables before any network code runs tells Python's ssl module,
# httpx, requests, and the Supabase client to use certifi's trusted CA bundle.
import certifi
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
os.environ.setdefault("REQUESTS_CA_BUNDLE", certifi.where())
# ──────────────────────────────────────────────────────────────────────────────

from fastapi import FastAPI

from app.core.configuration import settings
from app.routers import api_router
from app.middleware.cors import configure_cors
from app.middleware.rate_limiter import configure_rate_limiter

application = FastAPI(
    title="LumenIQ API",
    description="Backend API for the LumenIQ social media content intelligence platform",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

configure_cors(application)
configure_rate_limiter(application)

application.include_router(api_router, prefix=settings.api_version_prefix)


@application.get("/")
async def root():
    return {
        "service": "LumenIQ API",
        "version": "1.0.0",
        "documentation": f"{settings.api_version_prefix}/docs",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:application",
        host="0.0.0.0",
        port=8000,
        reload=settings.app_debug,
    )
