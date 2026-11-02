from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.provenance import DataSource, ImportedDataset
from app.models.vessel import Vessel
from app.models.terminal import Berth
from app.models.yard import YardBlock
from app.schemas.provenance import DataSourceRead, ProvenanceSummaryResponse

router = APIRouter(prefix="/provenance", tags=["Data Provenance & Governance"])


@router.get("/sources", response_model=List[DataSourceRead])
def list_data_sources(db: Session = Depends(get_db)):
    """List registered public, official, and synthetic data sources."""
    return db.query(DataSource).all()


@router.get("/summary", response_model=ProvenanceSummaryResponse)
def get_provenance_summary(db: Session = Depends(get_db)):
    """Retrieve system-wide data provenance breakdown and truthfulness disclosures."""
    total_sources = db.query(DataSource).count()
    total_datasets = db.query(ImportedDataset).count()

    # Record counts across entities
    vessel_count = db.query(Vessel).count()
    berth_count = db.query(Berth).count()
    yard_count = db.query(YardBlock).count()

    return ProvenanceSummaryResponse(
        total_data_sources=total_sources,
        total_imported_datasets=total_datasets,
        data_status_breakdown={
            "SIMULATED": vessel_count + berth_count + yard_count,
            "OBSERVED": 0,
            "FORECAST": 0,
            "DERIVED": 0,
            "UNAVAILABLE": 0,
        },
        active_data_policy="DATA-POL-001 (5-Tier Status Tagging)",
        disclaimer="All demonstration operational records are synthetically generated for research/competition evaluation. No live CPA or AIS connections exist in this environment.",
    )

