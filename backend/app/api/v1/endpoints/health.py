from fastapi import APIRouter, Depends
from app.config import Settings, get_settings
from app.schemas.health import HealthResponse, SystemStatusResponse

router = APIRouter(tags=["Health & System"])


@router.get("/health", response_model=HealthResponse)
async def check_health(settings: Settings = Depends(get_settings)) -> HealthResponse:
    """Return concise service health status."""
    return HealthResponse(
        status="ok",
        service="portos-backend",
        version=settings.app_version,
        demo_mode=settings.demo_mode,
        environment=settings.app_env,
    )


@router.get("/system/status", response_model=SystemStatusResponse)
async def get_system_status(settings: Settings = Depends(get_settings)) -> SystemStatusResponse:
    """Return comprehensive system status and subsystem health."""
    has_gemini = bool(settings.gemini_api_key and settings.gemini_api_key.strip())
    return SystemStatusResponse(
        version=settings.app_version,
        demo_mode=settings.demo_mode,
        environment=settings.app_env,
        timezone=settings.app_timezone,
        gemini_status="configured" if has_gemini else "offline_demo_mode",
        database_configured=bool(settings.database_url),
        data_status="SIMULATED",
    )

