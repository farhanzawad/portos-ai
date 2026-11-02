import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class VesselTypeEnum(str, enum.Enum):
    CONTAINER_FEEDER = "CONTAINER_FEEDER"
    BULK_CARRIER = "BULK_CARRIER"
    GENERAL_CARGO = "GENERAL_CARGO"
    TANKER = "TANKER"


class CallStatusEnum(str, enum.Enum):
    EN_ROUTE = "EN_ROUTE"
    OUTER_ANCHORAGE = "OUTER_ANCHORAGE"
    PILOT_BOARDING = "PILOT_BOARDING"
    BERTHED = "BERTHED"
    OPERATING = "OPERATING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class DelayRiskStatusEnum(str, enum.Enum):
    NORMAL = "NORMAL"
    WATCH = "WATCH"
    HIGH_RISK = "HIGH_RISK"


class Vessel(Base, ProvenanceMixin):
    """Vessel specification and registry model."""

    __tablename__ = "vessels"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    imo_number: Mapped[str] = mapped_column(String(16), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    call_sign: Mapped[str] = mapped_column(String(32), nullable=False)
    flag_country: Mapped[str] = mapped_column(String(64), nullable=False)
    vessel_type: Mapped[VesselTypeEnum] = mapped_column(
        SQLEnum(VesselTypeEnum, name="vessel_type_enum", native_enum=False),
        default=VesselTypeEnum.CONTAINER_FEEDER,
        nullable=False,
    )
    length_overall_m: Mapped[float] = mapped_column(Float, nullable=False)
    beam_m: Mapped[float] = mapped_column(Float, nullable=False)
    max_draft_m: Mapped[float] = mapped_column(Float, nullable=False)
    teu_capacity: Mapped[int] = mapped_column(Integer, nullable=False)
    dwt_tonnes: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    calls: Mapped[List["VesselCall"]] = relationship("VesselCall", back_populates="vessel", cascade="all, delete-orphan")


class VesselCall(Base, ProvenanceMixin):
    """Vessel voyage port call model."""

    __tablename__ = "vessel_calls"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vessel_id: Mapped[str] = mapped_column(String(64), ForeignKey("vessels.id", ondelete="CASCADE"), nullable=False, index=True)
    terminal_id: Mapped[str] = mapped_column(String(64), ForeignKey("terminals.id", ondelete="CASCADE"), nullable=False, index=True)
    call_number: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    voyage_number: Mapped[str] = mapped_column(String(64), nullable=False)
    reported_eta: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    predicted_eta: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_pilot_arrival: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_berth_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_departure_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[CallStatusEnum] = mapped_column(
        SQLEnum(CallStatusEnum, name="call_status_enum", native_enum=False),
        default=CallStatusEnum.EN_ROUTE,
        nullable=False,
        index=True,
    )
    delay_risk_status: Mapped[DelayRiskStatusEnum] = mapped_column(
        SQLEnum(DelayRiskStatusEnum, name="delay_risk_status_enum", native_enum=False),
        default=DelayRiskStatusEnum.NORMAL,
        nullable=False,
        index=True,
    )
    delay_risk_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    predicted_delay_hours: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Cargo manifest aggregates (non-sensitive)
    inbound_teu: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    outbound_teu: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    vessel: Mapped["Vessel"] = relationship("Vessel", back_populates="calls")
    berth_assignments: Mapped[List["BerthAssignment"]] = relationship("BerthAssignment", back_populates="vessel_call", cascade="all, delete-orphan")
    positions: Mapped[List["VesselPosition"]] = relationship("VesselPosition", back_populates="vessel_call", cascade="all, delete-orphan")


class VesselPosition(Base, ProvenanceMixin):
    """Geographic positioning update for vessel tracking."""

    __tablename__ = "vessel_positions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    vessel_call_id: Mapped[str] = mapped_column(String(64), ForeignKey("vessel_calls.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    speed_knots: Mapped[float] = mapped_column(Float, nullable=False)
    heading_degrees: Mapped[float] = mapped_column(Float, nullable=False)
    navigational_status: Mapped[str] = mapped_column(String(64), default="Under way using engine", nullable=False)
    distance_to_pilot_nm: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    # Relationships
    vessel_call: Mapped["VesselCall"] = relationship("VesselCall", back_populates="positions")

    __table_args__ = (
        Index("idx_vessel_pos_call_time", "vessel_call_id", "timestamp"),
    )

