from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.db.base import DataStatusEnum
from app.models.provenance import (
    SourceTypeEnum,
    FileFormatEnum,
    IngestionStatusEnum,
    ValidationStatusEnum,
    IssueTypeEnum,
    IssueSeverityEnum,
)


class DataSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    organization: str
    source_type: SourceTypeEnum
    url: Optional[str] = None
    description: str
    is_verified: bool
    data_status: DataStatusEnum


class DataQualityIssueRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    field_name: str
    issue_type: IssueTypeEnum
    description: str
    severity: IssueSeverityEnum


class ImportedRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    row_index: int
    source_location: Optional[str] = None
    raw_payload_json: Dict[str, Any]
    normalized_payload_json: Dict[str, Any]
    validation_status: ValidationStatusEnum
    is_accepted: bool
    rejection_reason: Optional[str] = None
    issues: List[str] = Field(default_factory=list)


class ImportedDatasetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    data_source_id: str
    file_name: str
    file_format: FileFormatEnum
    file_sha256: str
    file_size_bytes: int
    document_type: str
    scanned_pdf_detected: bool
    record_count: int
    ingestion_status: IngestionStatusEnum
    rejection_reason: Optional[str] = None
    uploaded_at: datetime
    data_status: DataStatusEnum
    records: Optional[List[ImportedRecordRead]] = None
    quality_issues: Optional[List[DataQualityIssueRead]] = None


class DocumentUploadResponse(BaseModel):
    dataset_id: str
    file_name: str
    file_format: FileFormatEnum
    file_sha256: str
    file_size_bytes: int
    document_type: str
    scanned_pdf_detected: bool
    scanned_message: Optional[str] = None
    total_rows_parsed: int
    valid_rows_count: int
    warning_rows_count: int
    invalid_rows_count: int
    duplicate_rows_count: int
    ingestion_status: IngestionStatusEnum
    records: List[ImportedRecordRead]
    issues: List[DataQualityIssueRead]
    provenance_note: str
    data_status: DataStatusEnum


class RecordCorrectionRequest(BaseModel):
    row_id: str
    updated_fields: Dict[str, Any]
    is_accepted: Optional[bool] = None
    rejection_reason: Optional[str] = None


class CommitDatasetRequest(BaseModel):
    dataset_id: str
    reviewer_name: str = Field(..., min_length=2, max_length=128)
    operator_notes: Optional[str] = None
    corrections: Optional[List[RecordCorrectionRequest]] = None


class ImportSummaryReport(BaseModel):
    dataset_id: str
    file_name: str
    file_sha256: str
    total_records: int
    accepted_records: int
    rejected_records: int
    duplicate_records: int
    review_required_records: int
    ingestion_status: IngestionStatusEnum
    reviewer_name: str
    committed_at: datetime
    provenance_hash: str
    data_status: DataStatusEnum
    audit_message: str

