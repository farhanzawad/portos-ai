import enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class RecommendationTypeEnum(str, enum.Enum):
    BERTH_SCHEDULE_REALLOCATION = "BERTH_SCHEDULE_REALLOCATION"
    DISRUPTION_RECOVERY_PLAN = "DISRUPTION_RECOVERY_PLAN"
    YARD_REEFER_LOAD_BALANCE = "YARD_REEFER_LOAD_BALANCE"


class RecommendationStatusEnum(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    SUPERSEDED = "SUPERSEDED"


class ReviewDecisionEnum(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class Recommendation(Base, ProvenanceMixin):
    """Advisory schedule or recovery proposal requiring human review."""

    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_type: Mapped[RecommendationTypeEnum] = mapped_column(
        SQLEnum(RecommendationTypeEnum, name="recommendation_type_enum", native_enum=False),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_payload_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    status: Mapped[RecommendationStatusEnum] = mapped_column(
        SQLEnum(RecommendationStatusEnum, name="recommendation_status_enum", native_enum=False),
        default=RecommendationStatusEnum.PENDING_REVIEW,
        nullable=False,
        index=True,
    )

    # Relationships
    reviews: Mapped[List["RecommendationReview"]] = relationship("RecommendationReview", back_populates="recommendation", cascade="all, delete-orphan")


class RecommendationReview(Base, ProvenanceMixin):
    """Audit log of human-in-the-loop review for an advisory recommendation."""

    __tablename__ = "recommendation_reviews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    recommendation_id: Mapped[str] = mapped_column(String(64), ForeignKey("recommendations.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reviewer_role: Mapped[str] = mapped_column(String(128), nullable=False)
    decision: Mapped[ReviewDecisionEnum] = mapped_column(
        SQLEnum(ReviewDecisionEnum, name="review_decision_enum", native_enum=False),
        nullable=False,
    )
    review_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    recommendation: Mapped["Recommendation"] = relationship("Recommendation", back_populates="reviews")

