import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class YardZoneEnum(str, enum.Enum):
    IMPORT = "IMPORT"
    EXPORT = "EXPORT"
    REEFER = "REEFER"
    EMPTY = "EMPTY"


class YardRiskTierEnum(str, enum.Enum):
    NORMAL = "NORMAL"
    WATCH = "WATCH"
    HIGH_RISK = "HIGH_RISK"


class MovementTypeEnum(str, enum.Enum):
    DISCHARGE_TO_YARD = "DISCHARGE_TO_YARD"
    YARD_TO_GATE = "YARD_TO_GATE"
    GATE_TO_YARD = "GATE_TO_YARD"
    YARD_TO_VESSEL = "YARD_TO_VESSEL"
    HOUSEKEEPING_SHIFT = "HOUSEKEEPING_SHIFT"


class YardBlock(Base, ProvenanceMixin):
    """Container yard block sector."""

    __tablename__ = "yard_blocks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    terminal_id: Mapped[str] = mapped_column(String(64), ForeignKey("terminals.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    zone: Mapped[YardZoneEnum] = mapped_column(
        SQLEnum(YardZoneEnum, name="yard_zone_enum", native_enum=False),
        default=YardZoneEnum.IMPORT,
        nullable=False,
    )
    teu_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    warning_threshold_pct: Mapped[float] = mapped_column(Float, default=85.0, nullable=False)
    critical_threshold_pct: Mapped[float] = mapped_column(Float, default=95.0, nullable=False)

    # Relationships
    observations: Mapped[List["YardOccupancyObservation"]] = relationship("YardOccupancyObservation", back_populates="yard_block", cascade="all, delete-orphan")
    movements: Mapped[List["ContainerMovementEvent"]] = relationship("ContainerMovementEvent", back_populates="yard_block", cascade="all, delete-orphan")


class YardOccupancyObservation(Base, ProvenanceMixin):
    """Timestamped yard occupancy snapshot and multi-horizon forecast."""

    __tablename__ = "yard_occupancy_observations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    yard_block_id: Mapped[str] = mapped_column(String(64), ForeignKey("yard_blocks.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    occupied_teu: Mapped[int] = mapped_column(Integer, nullable=False)
    occupancy_pct: Mapped[float] = mapped_column(Float, nullable=False)
    reefer_occupied_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    risk_tier: Mapped[YardRiskTierEnum] = mapped_column(
        SQLEnum(YardRiskTierEnum, name="yard_risk_tier_enum", native_enum=False),
        default=YardRiskTierEnum.NORMAL,
        nullable=False,
        index=True,
    )
    forecast_horizon_hrs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    yard_block: Mapped["YardBlock"] = relationship("YardBlock", back_populates="observations")

    __table_args__ = (
        Index("idx_yard_obs_block_time", "yard_block_id", "timestamp"),
    )


class ContainerMovementEvent(Base, ProvenanceMixin):
    """Anonymized aggregated container transfer event (no consignee PII)."""

    __tablename__ = "container_movement_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    yard_block_id: Mapped[str] = mapped_column(String(64), ForeignKey("yard_blocks.id", ondelete="CASCADE"), nullable=False, index=True)
    vessel_call_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("vessel_calls.id", ondelete="SET NULL"), nullable=True, index=True)
    equipment_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("equipment.id", ondelete="SET NULL"), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    movement_type: Mapped[MovementTypeEnum] = mapped_column(
        SQLEnum(MovementTypeEnum, name="movement_type_enum", native_enum=False),
        nullable=False,
    )
    teu_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Relationships
    yard_block: Mapped["YardBlock"] = relationship("YardBlock", back_populates="movements")

