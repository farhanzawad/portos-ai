from datetime import datetime, timezone
import enum
from typing import Optional
from sqlalchemy import String, DateTime, Enum as SQLEnum, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class DataStatusEnum(str, enum.Enum):
    """Standardized 5-tier data status classification."""

    SIMULATED = "SIMULATED"
    OBSERVED = "OBSERVED"
    FORECAST = "FORECAST"
    DERIVED = "DERIVED"
    UNAVAILABLE = "UNAVAILABLE"


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy 2 domain models."""
    pass


class ProvenanceMixin:
    """Standard audit and provenance columns for all operational records."""

    data_status: Mapped[DataStatusEnum] = mapped_column(
        SQLEnum(DataStatusEnum, name="data_status_enum", native_enum=False),
        default=DataStatusEnum.SIMULATED,
        nullable=False,
        index=True,
    )
    source_name: Mapped[str] = mapped_column(
        String(255),
        default="PORTOS Seed Engine",
        nullable=False,
    )
    source_url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    source_document_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    observed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    methodology_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

