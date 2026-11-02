import enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, ProvenanceMixin


class SourceTypeEnum(str, enum.Enum):
    PUBLIC_REPORT = "PUBLIC_REPORT"
    CPA_BULLETIN = "CPA_BULLETIN"
    SYNTHETIC_GENERATOR = "SYNTHETIC_GENERATOR"
    USER_UPLOAD = "USER_UPLOAD"
    OPEN_DATA = "OPEN_DATA"


class FileFormatEnum(str, enum.Enum):
    CSV = "CSV"
    XLSX = "XLSX"
    PDF = "PDF"
    JSON = "JSON"


class IngestionStatusEnum(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


class ValidationStatusEnum(str, enum.Enum):
    VALID = "VALID"
    WARNING = "WARNING"
    INVALID = "INVALID"
    DUPLICATE = "DUPLICATE"


class IssueTypeEnum(str, enum.Enum):
    MISSING_FIELD = "MISSING_FIELD"
    TYPE_MISMATCH = "TYPE_MISMATCH"
    RANGE_VIOLATION = "RANGE_VIOLATION"
    SUSPECT_UNIT = "SUSPECT_UNIT"
    DUPLICATE = "DUPLICATE"


class IssueSeverityEnum(str, enum.Enum):
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class DataSource(Base, ProvenanceMixin):
    """Origin registry for ingested public, official, or simulated data feeds."""

    __tablename__ = "data_sources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    organization: Mapped[str] = mapped_column(String(255), nullable=False)
    source_type: Mapped[SourceTypeEnum] = mapped_column(
        SQLEnum(SourceTypeEnum, name="source_type_enum", native_enum=False),
        nullable=False,
    )
    url: Mapped[Optional[str]] = mapped_column(String(1024), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    datasets: Mapped[List["ImportedDataset"]] = relationship("ImportedDataset", back_populates="data_source", cascade="all, delete-orphan")


class ImportedDataset(Base, ProvenanceMixin):
    """File or batch imported through Port Data Bridge."""

    __tablename__ = "imported_datasets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    data_source_id: Mapped[str] = mapped_column(String(64), ForeignKey("data_sources.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_format: Mapped[FileFormatEnum] = mapped_column(
        SQLEnum(FileFormatEnum, name="file_format_enum", native_enum=False),
        nullable=False,
    )
    file_sha256: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    document_type: Mapped[str] = mapped_column(String(64), default="VESSEL_BERTHING_LOG", nullable=False)
    scanned_pdf_detected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    record_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ingestion_status: Mapped[IngestionStatusEnum] = mapped_column(
        SQLEnum(IngestionStatusEnum, name="ingestion_status_enum", native_enum=False),
        default=IngestionStatusEnum.PENDING_REVIEW,
        nullable=False,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    data_source: Mapped["DataSource"] = relationship("DataSource", back_populates="datasets")
    records: Mapped[List["ImportedRecord"]] = relationship("ImportedRecord", back_populates="imported_dataset", cascade="all, delete-orphan")
    quality_issues: Mapped[List["DataQualityIssue"]] = relationship("DataQualityIssue", back_populates="imported_dataset", cascade="all, delete-orphan")


class ImportedRecord(Base, ProvenanceMixin):
    """Raw vs. normalized row extracted from an imported dataset."""

    __tablename__ = "imported_records"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    imported_dataset_id: Mapped[str] = mapped_column(String(64), ForeignKey("imported_datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    row_index: Mapped[int] = mapped_column(Integer, nullable=False)
    source_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    raw_payload_json: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    normalized_payload_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    validation_status: Mapped[ValidationStatusEnum] = mapped_column(
        SQLEnum(ValidationStatusEnum, name="validation_status_enum", native_enum=False),
        default=ValidationStatusEnum.VALID,
        nullable=False,
    )
    is_accepted: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    imported_dataset: Mapped["ImportedDataset"] = relationship("ImportedDataset", back_populates="records")


class DataQualityIssue(Base, ProvenanceMixin):
    """Data hygiene issue flagged during import parsing."""

    __tablename__ = "data_quality_issues"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    imported_dataset_id: Mapped[str] = mapped_column(String(64), ForeignKey("imported_datasets.id", ondelete="CASCADE"), nullable=False, index=True)
    field_name: Mapped[str] = mapped_column(String(128), nullable=False)
    issue_type: Mapped[IssueTypeEnum] = mapped_column(
        SQLEnum(IssueTypeEnum, name="issue_type_enum", native_enum=False),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[IssueSeverityEnum] = mapped_column(
        SQLEnum(IssueSeverityEnum, name="issue_severity_enum", native_enum=False),
        default=IssueSeverityEnum.WARNING,
        nullable=False,
    )

    # Relationships
    imported_dataset: Mapped["ImportedDataset"] = relationship("ImportedDataset", back_populates="quality_issues")
