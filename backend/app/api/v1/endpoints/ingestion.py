from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.provenance import ImportedDataset, DataSource
from app.ingestion.service import port_data_bridge_service
from app.ingestion.parser import DocumentSecurityError
from app.schemas.ingestion import (
    DocumentUploadResponse,
    ImportedDatasetRead,
    ImportedRecordRead,
    DataSourceRead,
    CommitDatasetRequest,
    ImportSummaryReport,
    RecordCorrectionRequest,
)

router = APIRouter(prefix="/ingestion", tags=["Port Data Bridge & Document Ingestion"])


@router.get("/sources", response_model=List[DataSourceRead])
def list_data_sources(db: Session = Depends(get_db)):
    """List registered origin data sources for port data feeds."""
    sources = db.query(DataSource).order_by(DataSource.is_verified.desc(), DataSource.name).all()
    return sources


@router.post("/upload", response_model=DocumentUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(..., description="Document to ingest (CSV, XLSX, or searchable PDF)"),
    data_source_id: Optional[str] = Form(None, description="Registered data source ID"),
    document_type: str = Form("VESSEL_BERTHING_LOG", description="Operational document domain"),
    db: Session = Depends(get_db),
):
    """Upload and stage an operational document for human review.
    
    Validates file headers, computes SHA-256 checksum, sanitizes formula injections,
    and extracts candidate operational records without silent assumptions.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Uploaded file must have a valid filename.")

    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file content: {str(e)}")

    try:
        response = port_data_bridge_service.stage_uploaded_document(
            db=db,
            filename=file.filename,
            content=content,
            data_source_id=data_source_id,
            document_type=document_type,
        )
        return response
    except DocumentSecurityError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")


@router.get("/datasets", response_model=List[ImportedDatasetRead])
def list_imported_datasets(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List staged and committed operational datasets."""
    datasets = (
        db.query(ImportedDataset)
        .order_by(ImportedDataset.uploaded_at.desc())
        .limit(limit)
        .all()
    )
    return datasets


@router.get("/datasets/{dataset_id}", response_model=ImportedDatasetRead)
def get_imported_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of an imported dataset with candidate records and issues."""
    data = port_data_bridge_service.get_dataset(db, dataset_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found.")
    return data


@router.patch("/datasets/{dataset_id}/records/{record_id}", response_model=ImportedRecordRead)
def correct_or_reject_record(
    dataset_id: str,
    record_id: str,
    request: RecordCorrectionRequest,
    db: Session = Depends(get_db),
):
    """Apply human-in-the-loop field correction or rejection to an individual record."""
    updated = port_data_bridge_service.correct_record(
        db=db,
        dataset_id=dataset_id,
        record_id=record_id,
        updated_fields=request.updated_fields,
        is_accepted=request.is_accepted,
        rejection_reason=request.rejection_reason,
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Record '{record_id}' not found in dataset '{dataset_id}'.")
    return updated


@router.post("/datasets/{dataset_id}/commit", response_model=ImportSummaryReport)
def commit_dataset(
    dataset_id: str,
    request: CommitDatasetRequest,
    db: Session = Depends(get_db),
):
    """Commit reviewed records into the operational database with human verification provenance."""
    if request.dataset_id != dataset_id:
        raise HTTPException(status_code=400, detail="Mismatched dataset ID in path and request body.")

    try:
        report = port_data_bridge_service.commit_dataset(
            db=db,
            dataset_id=dataset_id,
            reviewer_name=request.reviewer_name,
            operator_notes=request.operator_notes,
            corrections=request.corrections,
        )
        return report
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to commit dataset: {str(e)}")


@router.get("/templates/csv")
def download_csv_template():
    """Download sanitized CSV template for berthing schedules."""
    csv_text = port_data_bridge_service.generate_template_csv()
    return PlainTextResponse(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="chattogram_berthing_schedule_template.csv"'},
    )


@router.get("/templates/xlsx")
def download_xlsx_template():
    """Download styled XLSX template for berthing schedules."""
    xlsx_bytes = port_data_bridge_service.generate_template_xlsx()
    return Response(
        content=xlsx_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": 'attachment; filename="chattogram_berthing_schedule_template.xlsx"'},
    )
