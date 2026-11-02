import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_v1_router
from app.config import get_settings
from app.schemas.health import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("portos-backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    settings = get_settings()
    logger.info("Initializing %s v%s", settings.app_name, settings.app_version)
    logger.info("Operating Environment: %s | Timezone: %s", settings.app_env, settings.app_timezone)

    if settings.demo_mode:
        logger.info("DEMO MODE ACTIVE: Operational records default to SIMULATED status.")

    if not settings.gemini_api_key or not settings.gemini_api_key.strip():
        logger.info("GEMINI_API_KEY not configured. Running AI features in Offline Demo Mode.")
    else:
        logger.info("Gemini integration enabled using model: %s", settings.gemini_model)

    yield
    logger.info("Shutting down %s", settings.app_name)


def create_application() -> FastAPI:
    """Instantiate and configure the FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Port Operations Intelligence System (PORTOS AI) Backend API",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # CORS configuration
    origins = [settings.frontend_origin]
    # In development, also permit common localhost ports if configured
    if settings.app_env == "development":
        origins.extend([
            "http://127.0.0.1:3000",
            "http://localhost:3000",
        ])

    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(set(origins)),
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["*"],
    )

    # Root-level health check endpoint (as required by prompt)
    @app.get("/health", response_model=HealthResponse, tags=["Health & System"])
    async def root_health() -> HealthResponse:
        """Top-level health check endpoint."""
        return HealthResponse(
            status="ok",
            service="portos-backend",
            version=settings.app_version,
            demo_mode=settings.demo_mode,
            environment=settings.app_env,
        )

    # Mount API v1 router
    app.include_router(api_v1_router)

    return app


app = create_application()

