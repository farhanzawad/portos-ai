from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.provenance import DataSource
from app.gov_data.service import gov_data_service
from app.schemas.gov_data import (
    GovDataSourceRead,
    GovTideRecordRead,
    GovTideComplianceResult,
    GovBerthSpecRead,
    GovMetBulletinRead,
    GovThroughputBenchmarkRead,
)

router = APIRouter(prefix="/gov", tags=["Official Bangladesh Government & Port Authority Data"])


@router.get("/sources", response_model=List[GovDataSourceRead])
def list_gov_data_sources(db: Session = Depends(get_db)):
    """List registered Bangladesh Government and official Port Authority data sources."""
    sources = (
        db.query(DataSource)
        .filter(DataSource.id.in_([
            "ds_cpa_bulletin",
            "ds_cpa_tides",
            "ds_cpa_berths",
            "ds_bmd_patenga",
            "ds_cpa_annual_stats",
        ]))
        .all()
    )
    if not sources:
        # Fallback query all verified sources
        sources = db.query(DataSource).filter(DataSource.is_verified == True).all()
    return sources


@router.get("/tides", response_model=List[GovTideRecordRead])
def get_tide_circulars(
    date: Optional[str] = Query(None, description="Filter by YYYY-MM-DD date"),
):
    """Retrieve official CPA Hydrography Department tide tables and permissible draft limits."""
    return gov_data_service.get_tides(date_str=date)


@router.get("/tides/check-compliance", response_model=GovTideComplianceResult)
def check_vessel_tide_compliance(
    draft_m: float = Query(..., ge=1.0, le=20.0, description="Vessel arrival/departure draft in meters"),
    loa_m: float = Query(..., ge=10.0, le=400.0, description="Vessel length overall in meters"),
    date: Optional[str] = Query(None, description="Arrival date (YYYY-MM-DD)"),
):
    """Evaluate whether a vessel's draft and LOA comply with CPA high-water draft and daylight navigation circulars."""
    return gov_data_service.check_compliance(draft_m=draft_m, loa_m=loa_m, target_date=date)


@router.get("/berth-specifications", response_model=List[GovBerthSpecRead])
def get_berth_specifications(
    terminal: Optional[str] = Query(None, description="Filter by terminal code (e.g. CCT, NCT, GCB)"),
):
    """Retrieve official CPA technical berth dimensions, design depths, and crane rail gauges."""
    return gov_data_service.get_berth_specs(terminal_code=terminal)


@router.get("/met-bulletins", response_model=List[GovMetBulletinRead])
def get_met_bulletins(
    min_signal: Optional[int] = Query(None, ge=0, le=10, description="Filter by minimum BMD danger signal number"),
):
    """Retrieve official Bangladesh Meteorological Department (BMD) Patenga marine bulletins."""
    return gov_data_service.get_met_bulletins(min_signal=min_signal)


@router.get("/throughput-benchmarks", response_model=List[GovThroughputBenchmarkRead])
def get_throughput_benchmarks():
    """Retrieve official CPA annual container throughput, turnaround, and berth occupancy statistics."""
    return gov_data_service.get_throughput_benchmarks()


@router.get("/sample-file", response_class=PlainTextResponse)
def get_gov_sample_file(
    file_type: str = Query("berthing_log", description="Sample file key: berthing_log, tides, berths, met, stats"),
):
    """Download verified sample government files for testing or Port Data Bridge ingestion."""
    filename_map = {
        "berthing_log": "cpa_sample_berthing_log.csv",
        "tides": "cpa_tide_circular_2026.csv",
        "berths": "cpa_berth_specifications_2026.csv",
        "met": "bmd_patenga_marine_bulletin_2026.csv",
        "stats": "cpa_annual_statistics_2025.csv",
    }
    target_filename = filename_map.get(file_type)
    if not target_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown file_type '{file_type}'. Valid choices: {list(filename_map.keys())}",
        )

    file_path = gov_data_service.data_dir / target_filename
    if not file_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"File '{target_filename}' not found.")

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    return PlainTextResponse(content=content, media_type="text/csv")
