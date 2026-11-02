from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.db.base import DataStatusEnum
from app.models.sustainability import (
    PollutantTypeEnum,
    ActivityTypeEnum,
    FactorStatusEnum,
)


class EmissionFactorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pollutant: PollutantTypeEnum
    activity_type: ActivityTypeEnum
    factor_value: float
    factor_unit: str
    source_reference: str
    source_url: Optional[str] = None
    publication_date: Optional[str] = None
    scope_category: Optional[str] = None
    applicability_notes: Optional[str] = None
    is_illustrative_assumption: bool
    factor_status: FactorStatusEnum
    data_status: DataStatusEnum


class ActivityEmissionsEstimate(BaseModel):
    activity_type: ActivityTypeEnum
    activity_name: str
    scope_category: str
    activity_quantity: float
    activity_unit: str
    pollutant: PollutantTypeEnum
    factor_id: Optional[str] = None
    factor_value: Optional[float] = None
    factor_unit: Optional[str] = None
    factor_status: Optional[str] = None
    source_reference: Optional[str] = None
    source_url: Optional[str] = None
    estimated_kg: Optional[float] = None
    estimated_mt: Optional[float] = None
    formula_expression: str
    is_configured: bool = True
    applicability_note: Optional[str] = None


class PollutantBreakdown(BaseModel):
    pollutant: PollutantTypeEnum
    pollutant_name: str
    unit: str
    total_kg: float
    total_mt: float
    activities: List[ActivityEmissionsEstimate]


class ActivityDelta(BaseModel):
    activity_type: ActivityTypeEnum
    activity_name: str
    scope_category: str
    baseline_quantity: float
    comparison_quantity: float
    quantity_unit: str
    baseline_kg: float
    comparison_kg: float
    delta_kg: float
    delta_pct: float
    formula_expression: str


class ScenarioEmissionsComparison(BaseModel):
    baseline_scenario_code: str
    baseline_scenario_name: str
    comparison_scenario_code: str
    comparison_scenario_name: str
    duration_hours: float
    factor_set_id: str
    factor_count: int
    comparison_integrity_verified: bool
    scope_boundary_note: str
    baseline_total_co2e_kg: float
    comparison_total_co2e_kg: float
    delta_co2e_kg: float
    delta_co2e_pct: float
    baseline_total_co2e_mt: float
    comparison_total_co2e_mt: float
    delta_co2e_mt: float
    activity_deltas: List[ActivityDelta] = Field(default_factory=list)
    calculation_method: str
    disclaimer: str


class EnvironmentalContext(BaseModel):
    station_name: str
    observation_time: datetime
    temperature_celsius: float
    wind_speed_knots: float
    wind_direction: str
    tidal_height_m: float
    tide_phase: str
    air_quality_index: int
    air_quality_tier: str
    pm25_ug_m3: float
    navigational_use_prohibited_notice: str
    data_status: DataStatusEnum


class ScopeBoundaryDefinition(BaseModel):
    terminal_complex: str
    scope_1_included: List[str]
    scope_2_included: List[str]
    scope_3_included: List[str]
    explicitly_excluded: List[str]
    methodology_framework: str


class GreenPortOverviewResponse(BaseModel):
    terminal_id: str
    reporting_period_hours: float
    scope_definition: ScopeBoundaryDefinition
    total_co2e_mt: float
    total_co2e_kg: float
    pollutant_summaries: List[PollutantBreakdown]
    factors: List[EmissionFactorRead]
    baseline_comparison: ScenarioEmissionsComparison
    environmental_context: EnvironmentalContext
    data_status: DataStatusEnum
    timestamp: datetime

