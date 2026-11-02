from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.db.base import DataStatusEnum
from app.models.provenance import SourceTypeEnum


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


class ProvenanceSummaryResponse(BaseModel):
    total_data_sources: int
    total_imported_datasets: int
    data_status_breakdown: dict
    active_data_policy: str
    disclaimer: str

