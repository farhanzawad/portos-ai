import enum
from typing import Optional
from datetime import datetime
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class PollutantTypeEnum(str, enum.Enum):
    CO2E = "CO2E"
    SOX = "SOX"
    NOX = "NOX"
    PM25 = "PM25"


class ActivityTypeEnum(str, enum.Enum):
    VESSEL_HOTELING_AUX_ENGINE = "VESSEL_HOTELING_AUX_ENGINE"
    VESSEL_MANEUVERING = "VESSEL_MANEUVERING"
    STS_CRANE_ELECTRIC = "STS_CRANE_ELECTRIC"
    YARD_EQUIPMENT_DIESEL = "YARD_EQUIPMENT_DIESEL"


class EmissionFactor(Base, ProvenanceMixin):
    """Configured emission factor linking activity quantity to emissions."""

    __tablename__ = "emission_factors"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    pollutant: Mapped[PollutantTypeEnum] = mapped_column(
        SQLEnum(PollutantTypeEnum, name="pollutant_type_enum", native_enum=False),
        nullable=False,
    )
    activity_type: Mapped[ActivityTypeEnum] = mapped_column(
        SQLEnum(ActivityTypeEnum, name="activity_type_enum", native_enum=False),
        nullable=False,
    )
    factor_value: Mapped[float] = mapped_column(Float, nullable=False)
    factor_unit: Mapped[str] = mapped_column(String(64), nullable=False)
    source_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    is_illustrative_assumption: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class EmissionsEstimate(Base, ProvenanceMixin):
    """Auditable secondary emissions estimate derived from operational activity."""

    __tablename__ = "emissions_estimates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vessel_call_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("vessel_calls.id", ondelete="SET NULL"), nullable=True, index=True)
    scenario_run_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("scenario_runs.id", ondelete="SET NULL"), nullable=True, index=True)
    emission_factor_id: Mapped[str] = mapped_column(String(64), ForeignKey("emission_factors.id", ondelete="CASCADE"), nullable=False)
    calculation_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    activity_type: Mapped[ActivityTypeEnum] = mapped_column(
        SQLEnum(ActivityTypeEnum, name="activity_type_estimate_enum", native_enum=False),
        nullable=False,
    )
    activity_quantity: Mapped[float] = mapped_column(Float, nullable=False)
    activity_unit: Mapped[str] = mapped_column(String(32), nullable=False)
    estimated_emissions_kg: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    emission_factor: Mapped["EmissionFactor"] = relationship("EmissionFactor")
