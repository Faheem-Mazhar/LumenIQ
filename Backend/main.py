import logging

from fastapi import FastAPI

from app.core.configuration import settings
from app.routers import api_router
from app.middleware.cors import configure_cors
from app.middleware.rate_limiter import configure_rate_limiter
from app.middleware.request_logging import configure_request_logging

logging.basicConfig(
    level=logging.DEBUG if settings.app_debug else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)

application = FastAPI(
    title="LumenIQ API",
    description="Backend API for the LumenIQ social media content intelligence platform",
    version="1.0.0",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

configure_cors(application)
configure_rate_limiter(application)
configure_request_logging(application)

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
