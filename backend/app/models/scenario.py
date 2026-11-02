import enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class EventSeverityEnum(str, enum.Enum):
    INFO = "INFO"
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class EventTypeEnum(str, enum.Enum):
    VESSEL_DELAY_INJECTED = "VESSEL_DELAY_INJECTED"
    CRANE_OUTAGE = "CRANE_OUTAGE"
    WEATHER_RESTRICTION = "WEATHER_RESTRICTION"
    BERTH_CONFLICT = "BERTH_CONFLICT"
    YARD_BOTTLENECK = "YARD_BOTTLENECK"


class ScenarioRunStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class OperationalEvent(Base, ProvenanceMixin):
    """Terminal operational event or disruption alert."""

    __tablename__ = "operational_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    terminal_id: Mapped[str] = mapped_column(String(64), ForeignKey("terminals.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    event_type: Mapped[EventTypeEnum] = mapped_column(
        SQLEnum(EventTypeEnum, name="event_type_enum", native_enum=False),
        nullable=False,
        index=True,
    )
    severity: Mapped[EventSeverityEnum] = mapped_column(
        SQLEnum(EventSeverityEnum, name="event_severity_enum", native_enum=False),
        default=EventSeverityEnum.INFO,
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    payload_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)


class Scenario(Base, ProvenanceMixin):
    """Configured simulation scenario specification for Decision Lab."""

    __tablename__ = "scenarios"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_baseline: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    parameters_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    runs: Mapped[List["ScenarioRun"]] = relationship("ScenarioRun", back_populates="scenario", cascade="all, delete-orphan")


class ScenarioRun(Base, ProvenanceMixin):
    """Execution run instance of a SimPy simulation scenario."""

    __tablename__ = "scenario_runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    scenario_id: Mapped[str] = mapped_column(String(64), ForeignKey("scenarios.id", ondelete="CASCADE"), nullable=False, index=True)
    run_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    random_seed: Mapped[int] = mapped_column(Integer, default=42, nullable=False)
    duration_hours: Mapped[float] = mapped_column(Float, default=72.0, nullable=False)
    status: Mapped[ScenarioRunStatusEnum] = mapped_column(
        SQLEnum(ScenarioRunStatusEnum, name="scenario_run_status_enum", native_enum=False),
        default=ScenarioRunStatusEnum.PENDING,
        nullable=False,
    )

    # Relationships
    scenario: Mapped["Scenario"] = relationship("Scenario", back_populates="runs")
    results: Mapped[List["ScenarioResult"]] = relationship("ScenarioResult", back_populates="scenario_run", cascade="all, delete-orphan")


class ScenarioResult(Base, ProvenanceMixin):
    """Computed metric output from a SimPy simulation run."""

    __tablename__ = "scenario_results"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    scenario_run_id: Mapped[str] = mapped_column(String(64), ForeignKey("scenario_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    dimension_label: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    comparison_delta_baseline: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    scenario_run: Mapped["ScenarioRun"] = relationship("ScenarioRun", back_populates="results")

