import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class EquipmentTypeEnum(str, enum.Enum):
    STS_CRANE = "STS_CRANE"
    RTG_CRANE = "RTG_CRANE"
    STRADDLE_CARRIER = "STRADDLE_CARRIER"
    INTERNAL_TRUCK = "INTERNAL_TRUCK"


class EquipmentStatusEnum(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    DEGRADED = "DEGRADED"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"


class MaintenanceTypeEnum(str, enum.Enum):
    PREVENTIVE = "PREVENTIVE"
    CORRECTIVE = "CORRECTIVE"
    BREAKDOWN_INJECTED = "BREAKDOWN_INJECTED"


class Equipment(Base, ProvenanceMixin):
    """Terminal cargo-handling equipment model."""

    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    terminal_id: Mapped[str] = mapped_column(String(64), ForeignKey("terminals.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    equipment_type: Mapped[EquipmentTypeEnum] = mapped_column(
        SQLEnum(EquipmentTypeEnum, name="equipment_type_enum", native_enum=False),
        default=EquipmentTypeEnum.STS_CRANE,
        nullable=False,
    )
    status: Mapped[EquipmentStatusEnum] = mapped_column(
        SQLEnum(EquipmentStatusEnum, name="equipment_status_enum", native_enum=False),
        default=EquipmentStatusEnum.OPERATIONAL,
        nullable=False,
        index=True,
    )
    rated_capacity_tonnes: Mapped[float] = mapped_column(Float, default=40.0, nullable=False)
    rated_moves_per_hour: Mapped[float] = mapped_column(Float, default=28.0, nullable=False)
    assigned_berth_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("berths.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    telemetry: Mapped[List["EquipmentTelemetry"]] = relationship("EquipmentTelemetry", back_populates="equipment", cascade="all, delete-orphan")
    maintenance_events: Mapped[List["EquipmentMaintenanceEvent"]] = relationship("EquipmentMaintenanceEvent", back_populates="equipment", cascade="all, delete-orphan")


class EquipmentTelemetry(Base, ProvenanceMixin):
    """Telemetry log reading for terminal equipment."""

    __tablename__ = "equipment_telemetry"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    equipment_id: Mapped[str] = mapped_column(String(64), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    moves_per_hour_actual: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    power_consumption_kwh: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    operating_hours_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    trolley_position_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    hoist_speed_mps: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    active_load_tonnes: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    fault_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationships
    equipment: Mapped["Equipment"] = relationship("Equipment", back_populates="telemetry")

    __table_args__ = (
        Index("idx_equip_telemetry_time", "equipment_id", "timestamp"),
    )


class EquipmentMaintenanceEvent(Base, ProvenanceMixin):
    """Equipment maintenance, breakdown, or disruption event."""

    __tablename__ = "equipment_maintenance_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    equipment_id: Mapped[str] = mapped_column(String(64), ForeignKey("equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    maintenance_type: Mapped[MaintenanceTypeEnum] = mapped_column(
        SQLEnum(MaintenanceTypeEnum, name="maintenance_type_enum", native_enum=False),
        default=MaintenanceTypeEnum.PREVENTIVE,
        nullable=False,
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expected_end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_end_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_simulated_disruption: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    equipment: Mapped["Equipment"] = relationship("Equipment", back_populates="maintenance_events")

