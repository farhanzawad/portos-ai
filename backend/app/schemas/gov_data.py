from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.db.base import DataStatusEnum


class GovDataSourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    organization: str
    url: Optional[str] = None
    description: str
    is_verified: bool
    data_status: DataStatusEnum = DataStatusEnum.OBSERVED


class GovTideRecordRead(BaseModel):
    circular_id: str
    date: str
    hw_time_1: str
    hw_height_1_m: float
    lw_time_1: str
    lw_height_1_m: float
    hw_time_2: str
    hw_height_2_m: float
    lw_time_2: str
    lw_height_2_m: float
    max_permissible_draft_m: float
    day_nav_start: str
    day_nav_end: str
    gupta_bend_limit_m: float
    daylight_loa_cutoff_m: float
    navigation_restriction: str
    source_doc_ref: str
    data_status: DataStatusEnum = DataStatusEnum.OBSERVED


class GovTideComplianceResult(BaseModel):
    is_compliant: bool
    vessel_draft_m: float
    max_permissible_draft_m: float
    loa_m: float
    date: str
    tidal_phase: str
    requires_daylight_only: bool
    daylight_window: str
    violations: List[str]
    advisories: List[str]
    source_circular: str
    data_status: DataStatusEnum = DataStatusEnum.DERIVED


class GovBerthSpecRead(BaseModel):
    berth_code: str
    terminal_code: str
    terminal_name: str
    quay_length_m: float
    designed_depth_cd_m: float
    max_permissible_loa_m: float
    max_permissible_draft_m: float
    sts_crane_equipped: bool
    crane_rail_gauge_m: float
    bollard_capacity_tonnes: int
    apron_width_m: float
    night_navigation_allowed: bool
    power_supply_voltage_kv: float
    source_circular_no: str
    data_status: DataStatusEnum = DataStatusEnum.OBSERVED


class GovMetBulletinRead(BaseModel):
    bulletin_id: str
    station_code: str
    station_name: str
    issue_datetime: str
    forecast_area: str
    maritime_signal_code: str
    maritime_signal_name: str
    signal_number: int
    sustained_wind_knots: float
    gusting_wind_knots: float
    wind_direction: str
    wave_height_m: float
    sea_condition: str
    visibility_km: float
    port_operations_impact: str
    advisory_text: str
    source_ref: str
    data_status: DataStatusEnum = DataStatusEnum.OBSERVED


class GovThroughputBenchmarkRead(BaseModel):
    fiscal_year: str
    reporting_period: str
    total_container_throughput_teu: int
    import_container_teu: int
    export_container_teu: int
    transshipment_teu: int
    total_vessel_calls: int
    container_vessels_handled: int
    avg_turnaround_time_days: float
    avg_berth_occupancy_rate_pct: float
    avg_crane_productivity_moves_hr: float
    dwell_time_import_days: float
    dwell_time_export_days: float
    data_source_publication: str
    data_status: DataStatusEnum = DataStatusEnum.OBSERVED
