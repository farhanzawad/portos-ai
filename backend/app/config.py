from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """PORTOS AI System Configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "PORTOS AI Backend"
    app_version: str = "0.1.0"
    app_env: str = "development"
    demo_mode: bool = True
    app_timezone: str = "Asia/Dhaka"

    # Server binding
    host: str = "0.0.0.0"
    port: int = 8000

    # CORS configuration
    frontend_origin: str = "http://localhost:3000"

    # Database connection string (optional in Milestone 01)
    database_url: Optional[str] = "postgresql+psycopg://portos:portos_dev_password@localhost:5432/portos"

    # Google Gemini API configuration
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"

    # Simulation settings
    simulation_seed: int = 42
    simulation_speed: float = 1.0


@lru_cache()
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()

