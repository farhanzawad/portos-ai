import enum
from typing import Optional, List
from datetime import datetime
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class BerthStatusEnum(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    OCCUPIED = "OCCUPIED"
    MAINTENANCE = "MAINTENANCE"
    RESERVED = "RESERVED"


class AssignmentStatusEnum(str, enum.Enum):
    PROPOSED = "PROPOSED"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Terminal(Base, ProvenanceMixin):
    """Terminal operational facility model."""

    __tablename__ = "terminals"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country_code: Mapped[str] = mapped_column(String(3), default="BGD", nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Dhaka", nullable=False)
    total_quay_length_m: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    berths: Mapped[List["Berth"]] = relationship("Berth", back_populates="terminal", cascade="all, delete-orphan")


class Berth(Base, ProvenanceMixin):
    """Quayside berth lane model."""

    __tablename__ = "berths"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    terminal_id: Mapped[str] = mapped_column(String(64), ForeignKey("terminals.id", ondelete="CASCADE"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    length_m: Mapped[float] = mapped_column(Float, nullable=False)
    depth_draft_m: Mapped[float] = mapped_column(Float, nullable=False)
    max_vessel_loa_m: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status: Mapped[BerthStatusEnum] = mapped_column(
        SQLEnum(BerthStatusEnum, name="berth_status_enum", native_enum=False),
        default=BerthStatusEnum.AVAILABLE,
        nullable=False,
    )

    # Relationships
    terminal: Mapped["Terminal"] = relationship("Terminal", back_populates="berths")
    assignments: Mapped[List["BerthAssignment"]] = relationship("BerthAssignment", back_populates="berth", cascade="all, delete-orphan")


class BerthAssignment(Base, ProvenanceMixin):
    """Berth allocation schedule slot for a vessel call."""

    __tablename__ = "berth_assignments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    berth_id: Mapped[str] = mapped_column(String(64), ForeignKey("berths.id", ondelete="CASCADE"), nullable=False, index=True)
    vessel_call_id: Mapped[str] = mapped_column(String(64), ForeignKey("vessel_calls.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    scheduled_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    actual_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    assigned_quay_start_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    assigned_quay_end_m: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[AssignmentStatusEnum] = mapped_column(
        SQLEnum(AssignmentStatusEnum, name="assignment_status_enum", native_enum=False),
        default=AssignmentStatusEnum.PROPOSED,
        nullable=False,
        index=True,
    )
    optimizer_run_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    advisory_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    berth: Mapped["Berth"] = relationship("Berth", back_populates="assignments")
    vessel_call: Mapped["VesselCall"] = relationship("VesselCall", back_populates="berth_assignments")

    __table_args__ = (
        Index("idx_berth_assignment_time", "berth_id", "scheduled_start", "scheduled_end"),
    )
