import io
import csv
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.base import DataStatusEnum
from app.models.provenance import (
    DataSource,
    ImportedDataset,
    ImportedRecord,
    DataQualityIssue,
    SourceTypeEnum,
    FileFormatEnum,
    IngestionStatusEnum,
    ValidationStatusEnum,
    IssueTypeEnum,
    IssueSeverityEnum,
)
from app.ingestion.parser import (
    safe_document_parser,
    compute_sha256,
    sanitize_filename,
    sanitize_cell_value,
    ScannedPdfDetectedError,
    DocumentSecurityError,
)
from app.schemas.ingestion import (
    DocumentUploadResponse,
    ImportedRecordRead,
    DataQualityIssueRead,
    ImportSummaryReport,
    RecordCorrectionRequest,
)
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side


class PortDataBridgeService:
    """Core service for Port Data Bridge ingestion, human review, and provenance."""

    def stage_uploaded_document(
        self,
        db: Session,
        filename: str,
        content: bytes,
        data_source_id: Optional[str] = None,
        document_type: str = "VESSEL_BERTHING_LOG",
    ) -> DocumentUploadResponse:
        """Stages an uploaded document, parses candidate records, and flags data hygiene issues."""
        clean_filename = sanitize_filename(filename)
        sha256_hash = compute_sha256(content)
        file_size = len(content)

        # Ensure valid data source
        ds_id = data_source_id or "ds_user_upload"
        ds = db.query(DataSource).filter(DataSource.id == ds_id).first()
        if not ds:
            ds = DataSource(
                id=ds_id,
                code="USER-UPLOAD",
                name="Operator Staged Operational Dataset",
                organization="PORTOS User Ingestion",
                source_type=SourceTypeEnum.USER_UPLOAD,
                description="Operator uploaded spreadsheet or document for human review and ingestion.",
                is_verified=False,
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Data Bridge",
            )
            db.add(ds)
            db.flush()

        # Parse document
        file_format, parsed_rows, quality_issues, is_scanned_pdf, scanned_msg = safe_document_parser.parse(
            clean_filename, content
        )

        dataset_id = f"ds_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc)

        # Create dataset
        dataset = ImportedDataset(
            id=dataset_id,
            data_source_id=ds.id,
            file_name=clean_filename,
            file_format=file_format,
            file_sha256=sha256_hash,
            file_size_bytes=file_size,
            document_type=document_type,
            scanned_pdf_detected=is_scanned_pdf,
            record_count=len(parsed_rows),
            ingestion_status=IngestionStatusEnum.PENDING_REVIEW,
            rejection_reason=scanned_msg if is_scanned_pdf else None,
            uploaded_at=now,
            data_status=DataStatusEnum.SIMULATED,
            source_name="PORTOS Port Data Bridge",
        )
        db.add(dataset)
        db.flush()

        # Persist rows and quality issues
        record_reads: List[ImportedRecordRead] = []
        issue_reads: List[DataQualityIssueRead] = []

        valid_count = 0
        warning_count = 0
        invalid_count = 0
        duplicate_count = 0

        for r_dict in parsed_rows:
            rec_id = f"rec_{uuid.uuid4().hex[:12]}"
            status = r_dict["validation_status"]
            if status == ValidationStatusEnum.VALID:
                valid_count += 1
            elif status == ValidationStatusEnum.WARNING:
                warning_count += 1
            elif status == ValidationStatusEnum.INVALID:
                invalid_count += 1
            elif status == ValidationStatusEnum.DUPLICATE:
                duplicate_count += 1

            record = ImportedRecord(
                id=rec_id,
                imported_dataset_id=dataset_id,
                row_index=r_dict["row_index"],
                source_location=r_dict["source_location"],
                raw_payload_json=r_dict["raw_payload_json"],
                normalized_payload_json=r_dict["normalized_payload_json"],
                validation_status=status,
                is_accepted=r_dict["is_accepted"],
                rejection_reason=r_dict.get("rejection_reason"),
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Port Data Bridge",
            )
            db.add(record)

            record_reads.append(
                ImportedRecordRead(
                    id=rec_id,
                    row_index=r_dict["row_index"],
                    source_location=r_dict["source_location"],
                    raw_payload_json=r_dict["raw_payload_json"],
                    normalized_payload_json=r_dict["normalized_payload_json"],
                    validation_status=status,
                    is_accepted=r_dict["is_accepted"],
                    rejection_reason=r_dict.get("rejection_reason"),
                    issues=r_dict.get("issues", []),
                )
            )

        for q_dict in quality_issues:
            q_id = f"iss_{uuid.uuid4().hex[:12]}"
            issue = DataQualityIssue(
                id=q_id,
                imported_dataset_id=dataset_id,
                field_name=q_dict["field_name"],
                issue_type=q_dict["issue_type"],
                description=q_dict["description"],
                severity=q_dict["severity"],
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Port Data Bridge",
            )
            db.add(issue)

            issue_reads.append(
                DataQualityIssueRead(
                    id=q_id,
                    field_name=q_dict["field_name"],
                    issue_type=q_dict["issue_type"],
                    description=q_dict["description"],
                    severity=q_dict["severity"],
                )
            )

        db.commit()

        provenance_note = (
            f"Staged through Port Data Bridge. File SHA-256: {sha256_hash[:16]}... "
            f"({len(parsed_rows)} rows parsed). Requires human review before committing."
        )

        return DocumentUploadResponse(
            dataset_id=dataset_id,
            file_name=clean_filename,
            file_format=file_format,
            file_sha256=sha256_hash,
            file_size_bytes=file_size,
            document_type=document_type,
            scanned_pdf_detected=is_scanned_pdf,
            scanned_message=scanned_msg,
            total_rows_parsed=len(parsed_rows),
            valid_rows_count=valid_count,
            warning_rows_count=warning_count,
            invalid_rows_count=invalid_count,
            duplicate_rows_count=duplicate_count,
            ingestion_status=dataset.ingestion_status,
            records=record_reads,
            issues=issue_reads,
            provenance_note=provenance_note,
            data_status=DataStatusEnum.SIMULATED,
        )

    def get_dataset(self, db: Session, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Fetch dataset with its reviewable records and flagged issues."""
        dataset = db.query(ImportedDataset).filter(ImportedDataset.id == dataset_id).first()
        if not dataset:
            return None

        records = (
            db.query(ImportedRecord)
            .filter(ImportedRecord.imported_dataset_id == dataset_id)
            .order_by(ImportedRecord.row_index)
            .all()
        )
        issues = (
            db.query(DataQualityIssue)
            .filter(DataQualityIssue.imported_dataset_id == dataset_id)
            .all()
        )

        record_reads = [
            ImportedRecordRead(
                id=r.id,
                row_index=r.row_index,
                source_location=r.source_location,
                raw_payload_json=r.raw_payload_json,
                normalized_payload_json=r.normalized_payload_json,
                validation_status=r.validation_status,
                is_accepted=r.is_accepted,
                rejection_reason=r.rejection_reason,
                issues=[],
            )
            for r in records
        ]

        issue_reads = [
            DataQualityIssueRead(
                id=i.id,
                field_name=i.field_name,
                issue_type=i.issue_type,
                description=i.description,
                severity=i.severity,
            )
            for i in issues
        ]

        return {
            "id": dataset.id,
            "data_source_id": dataset.data_source_id,
            "file_name": dataset.file_name,
            "file_format": dataset.file_format,
            "file_sha256": dataset.file_sha256,
            "file_size_bytes": dataset.file_size_bytes,
            "document_type": dataset.document_type,
            "scanned_pdf_detected": dataset.scanned_pdf_detected,
            "record_count": dataset.record_count,
            "ingestion_status": dataset.ingestion_status,
            "rejection_reason": dataset.rejection_reason,
            "uploaded_at": dataset.uploaded_at,
            "data_status": dataset.data_status,
            "records": record_reads,
            "quality_issues": issue_reads,
        }

    def correct_record(
        self,
        db: Session,
        dataset_id: str,
        record_id: str,
        updated_fields: Dict[str, Any],
        is_accepted: Optional[bool] = None,
        rejection_reason: Optional[str] = None,
    ) -> Optional[ImportedRecordRead]:
        """Human-in-the-loop correction or rejection of an extracted record."""
        record = (
            db.query(ImportedRecord)
            .filter(
                ImportedRecord.id == record_id,
                ImportedRecord.imported_dataset_id == dataset_id,
            )
            .first()
        )
        if not record:
            return None

        # Apply field updates
        current_norm = dict(record.normalized_payload_json)
        for k, v in updated_fields.items():
            current_norm[k] = sanitize_cell_value(v)

        record.normalized_payload_json = current_norm

        if is_accepted is not None:
            record.is_accepted = is_accepted

        if rejection_reason is not None:
            record.rejection_reason = rejection_reason

        # Re-evaluate validation status
        v_name = current_norm.get("vessel_name")
        imo = str(current_norm.get("imo_number", ""))
        if not v_name or not (imo and len(imo) == 7 and imo.isdigit()):
            record.validation_status = ValidationStatusEnum.INVALID
        else:
            record.validation_status = ValidationStatusEnum.VALID

        db.commit()

        return ImportedRecordRead(
            id=record.id,
            row_index=record.row_index,
            source_location=record.source_location,
            raw_payload_json=record.raw_payload_json,
            normalized_payload_json=record.normalized_payload_json,
            validation_status=record.validation_status,
            is_accepted=record.is_accepted,
            rejection_reason=record.rejection_reason,
            issues=[],
        )

    def commit_dataset(
        self,
        db: Session,
        dataset_id: str,
        reviewer_name: str,
        operator_notes: Optional[str] = None,
        corrections: Optional[List[RecordCorrectionRequest]] = None,
    ) -> ImportSummaryReport:
        """Confirms and commits reviewed records into operational database with provenance."""
        dataset = db.query(ImportedDataset).filter(ImportedDataset.id == dataset_id).first()
        if not dataset:
            raise ValueError(f"Dataset {dataset_id} not found.")

        # Apply any batch corrections before committing
        if corrections:
            for corr in corrections:
                self.correct_record(
                    db,
                    dataset_id=dataset_id,
                    record_id=corr.row_id,
                    updated_fields=corr.updated_fields,
                    is_accepted=corr.is_accepted,
                    rejection_reason=corr.rejection_reason,
                )

        records = (
            db.query(ImportedRecord)
            .filter(ImportedRecord.imported_dataset_id == dataset_id)
            .all()
        )

        total_records = len(records)
        accepted_count = sum(1 for r in records if r.is_accepted)
        rejected_count = sum(1 for r in records if not r.is_accepted)
        duplicate_count = sum(1 for r in records if r.validation_status == ValidationStatusEnum.DUPLICATE)
        review_required_count = sum(1 for r in records if r.validation_status in (ValidationStatusEnum.WARNING, ValidationStatusEnum.INVALID))

        now = datetime.now(timezone.utc)

        # Transition status
        if accepted_count > 0:
            dataset.ingestion_status = IngestionStatusEnum.VERIFIED
            # Tag accepted records as OBSERVED (from user document)
            for r in records:
                if r.is_accepted:
                    r.data_status = DataStatusEnum.OBSERVED
                    r.source_name = f"Port Data Bridge: {dataset.file_name} (SHA: {dataset.file_sha256[:8]})"
        else:
            dataset.ingestion_status = IngestionStatusEnum.REJECTED

        dataset.rejection_reason = operator_notes

        # Compute provenance hash
        hash_seed = f"{dataset_id}:{dataset.file_sha256}:{reviewer_name}:{now.isoformat()}"
        provenance_hash = hashlib.sha256(hash_seed.encode("utf-8")).hexdigest()

        db.commit()

        audit_msg = (
            f"Dataset committed by human reviewer '{reviewer_name}'. "
            f"Accepted: {accepted_count}, Rejected: {rejected_count}, Total: {total_records}. "
            f"Provenance hash: {provenance_hash[:16]}."
        )

        return ImportSummaryReport(
            dataset_id=dataset.id,
            file_name=dataset.file_name,
            file_sha256=dataset.file_sha256,
            total_records=total_records,
            accepted_records=accepted_count,
            rejected_records=rejected_count,
            duplicate_records=duplicate_count,
            review_required_records=review_required_count,
            ingestion_status=dataset.ingestion_status,
            reviewer_name=reviewer_name,
            committed_at=now,
            provenance_hash=provenance_hash,
            data_status=DataStatusEnum.OBSERVED if accepted_count > 0 else DataStatusEnum.SIMULATED,
            audit_message=audit_msg,
        )

    def generate_template_csv(self) -> str:
        """Produces a downloadable, sanitized CSV template for berthing schedules."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "vessel_name",
            "imo_number",
            "arrival_time",
            "berth_code",
            "draft_m",
            "teu",
            "length_overall_m",
            "cargo_type",
        ])
        # Add sample synthetic rows
        writer.writerow([
            "MV Karnaphuli Pioneer",
            "9381024",
            "2026-11-04 08:00",
            "CCT-1",
            "8.5",
            "1450",
            "172.0",
            "Containerized Feeder",
        ])
        writer.writerow([
            "MV Bay Bengal",
            "9412035",
            "2026-11-04 14:30",
            "CCT-2",
            "9.1",
            "1820",
            "185.5",
            "Containerized Feeder",
        ])
        writer.writerow([
            "MV Padma Express",
            "9495018",
            "2026-11-05 06:15",
            "NCT-1",
            "8.2",
            "1200",
            "165.0",
            "Containerized Feeder",
        ])
        return output.getvalue()

    def generate_template_xlsx(self) -> bytes:
        """Produces a downloadable, styled XLSX template with clear headers and formula protections."""
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Berthing Lineup Template"

        headers = [
            "vessel_name",
            "imo_number",
            "arrival_time",
            "berth_code",
            "draft_m",
            "teu",
            "length_overall_m",
            "cargo_type",
        ]
        ws.append(headers)

        rows = [
            ["MV Karnaphuli Pioneer", "9381024", "2026-11-04 08:00", "CCT-1", 8.5, 1450, 172.0, "Containerized Feeder"],
            ["MV Bay Bengal", "9412035", "2026-11-04 14:30", "CCT-2", 9.1, 1820, 185.5, "Containerized Feeder"],
            ["MV Padma Express", "9495018", "2026-11-05 06:15", "NCT-1", 8.2, 1200, 165.0, "Containerized Feeder"],
        ]
        for r in rows:
            ws.append(r)

        # Apply industrial styling
        header_fill = PatternFill(start_color="102A43", end_color="102A43", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        for col_num in range(1, len(headers) + 1):
            cell = ws.cell(row=1, column=col_num)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
            ws.column_dimensions[openpyxl.utils.get_column_letter(col_num)].width = 20

        buf = io.BytesIO()
        wb.save(buf)
        return buf.getvalue()


port_data_bridge_service = PortDataBridgeService()

