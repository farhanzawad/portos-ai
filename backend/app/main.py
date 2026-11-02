import logging
import uuid
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1.router import api_v1_router
from app.config import get_settings
from app.schemas.health import HealthResponse
from app.schemas.common import ErrorResponse

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

    # 1. Request ID and Access Logging Middleware
    @app.middleware("http")
    async def request_id_and_logging_middleware(request: Request, call_next):
        req_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = req_id

        start_time = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start_time) * 1000

        response.headers["X-Request-ID"] = req_id

        # Log request without logging query params with sensitive tokens
        logger.info(
            "[%s] %s %s -> HTTP %d (%.1fms)",
            req_id[:8],
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        return response

    # 2. CORS configuration
    origins = [settings.frontend_origin]
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

    # 3. Standardized Exception Handlers
    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        req_id = getattr(request.state, "request_id", None)
        return JSONResponse(
            status_code=exc.status_code,
            content=ErrorResponse(
                error=f"HTTP {exc.status_code}",
                detail=str(exc.detail),
                request_id=req_id,
            ).model_dump(),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        req_id = getattr(request.state, "request_id", None)
        errors = [f"{err['loc'][-1]}: {err['msg']}" for err in exc.errors()]
        return JSONResponse(
            status_code=422,
            content=ErrorResponse(
                error="Validation Error",
                detail="; ".join(errors),
                request_id=req_id,
            ).model_dump(),
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        req_id = getattr(request.state, "request_id", None)
        logger.error("[%s] Unhandled exception: %s", req_id, exc, exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(
                error="Internal Server Error",
                detail="An internal server error occurred. Please contact the system administrator.",
                request_id=req_id,
            ).model_dump(),
        )

    # Root-level health check endpoint
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
