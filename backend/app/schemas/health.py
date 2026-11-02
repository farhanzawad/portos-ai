from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(default="ok", description="Overall service status")
    service: str = Field(default="portos-backend", description="Service identifier")
    version: str = Field(..., description="Service version string")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Current server timestamp in UTC",
    )
    demo_mode: bool = Field(..., description="Whether system is running in demo mode")
    environment: str = Field(..., description="Application environment (development/production)")


class SystemStatusResponse(BaseModel):
    """Detailed system status schema."""

    service: str = "portos-backend"
    version: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    demo_mode: bool
    environment: str
    timezone: str
    gemini_status: str = Field(
        ...,
        description="'configured' if GEMINI_API_KEY is present, otherwise 'offline_demo_mode'",
    )
    database_configured: bool = Field(
        ...,
        description="Whether a database URL is present in configuration",
    )
    data_status: str = Field(
        default="SIMULATED",
        description="Default operational record classification",
    )

