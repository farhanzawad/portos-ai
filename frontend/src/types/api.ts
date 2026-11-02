/**
 * TypeScript API Client Contracts for PORTOS AI
 * Matches FastAPI Pydantic v2 schemas in backend/app/schemas/
 */

export type DataStatus = "SIMULATED" | "OBSERVED" | "FORECAST" | "DERIVED" | "UNAVAILABLE";

export type VesselType = "CONTAINER_FEEDER" | "BULK_CARRIER" | "GENERAL_CARGO" | "TANKER";

export type CallStatus =
  | "EN_ROUTE"
  | "OUTER_ANCHORAGE"
  | "PILOT_BOARDING"
  | "BERTHED"
  | "OPERATING"
  | "COMPLETED"
  | "CANCELLED";

export type DelayRiskStatus = "NORMAL" | "WATCH" | "HIGH_RISK";

export type BerthStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "RESERVED";

export type AssignmentStatus = "PROPOSED" | "CONFIRMED" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export type EquipmentType = "STS_CRANE" | "RTG_CRANE" | "STRADDLE_CARRIER" | "INTERNAL_TRUCK";

export type EquipmentStatus = "OPERATIONAL" | "DEGRADED" | "MAINTENANCE" | "OFFLINE";

export type YardZone = "IMPORT" | "EXPORT" | "REEFER" | "EMPTY";

export type YardRiskTier = "NORMAL" | "WATCH" | "HIGH_RISK";

export type EventSeverity = "INFO" | "NORMAL" | "WARNING" | "CRITICAL";

export type EventType =
  | "VESSEL_DELAY_INJECTED"
  | "CRANE_OUTAGE"
  | "WEATHER_RESTRICTION"
  | "BERTH_CONFLICT"
  | "YARD_BOTTLENECK";

// Common Pagination & Error
export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ErrorResponse {
  error: string;
  detail?: string;
  request_id?: string;
}

// Health & System
export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  demo_mode: boolean;
  environment: string;
}

export interface SystemStatusResponse {
  service: string;
  version: string;
  timestamp: string;
  demo_mode: boolean;
  environment: string;
  timezone: string;
  gemini_status: string;
  database_configured: boolean;
  data_status: DataStatus;
}

// Terminal & Layout
export interface TerminalRead {
  id: string;
  code: string;
  name: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  total_quay_length_m: number;
  data_status: DataStatus;
  source_name: string;
}

export interface BerthRead {
  id: string;
  terminal_id: string;
  code: string;
  name: string;
  length_m: number;
  depth_draft_m: number;
  max_vessel_loa_m: number;
  is_active: boolean;
  status: BerthStatus;
  data_status: DataStatus;
  source_name: string;
}

export interface BerthAssignmentRead {
  id: string;
  berth_id: string;
  vessel_call_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  assigned_quay_start_m?: number;
  assigned_quay_end_m?: number;
  status: AssignmentStatus;
  optimizer_run_id?: string;
  advisory_notes?: string;
  data_status: DataStatus;
}

export interface TerminalLayoutRead {
  terminal: TerminalRead;
  berths: BerthRead[];
  quay_length_m: number;
  active_berth_count: number;
}

// Vessels
export interface VesselRead {
  id: string;
  imo_number: string;
  name: string;
  call_sign: string;
  flag_country: string;
  vessel_type: VesselType;
  length_overall_m: number;
  beam_m: number;
  max_draft_m: number;
  teu_capacity: number;
  dwt_tonnes: number;
  data_status: DataStatus;
  source_name: string;
}

export interface VesselPositionRead {
  id: string;
  vessel_call_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  speed_knots: number;
  heading_degrees: number;
  navigational_status: string;
  distance_to_pilot_nm: number;
  data_status: DataStatus;
}

export interface VesselCallRead {
  id: string;
  vessel_id: string;
  terminal_id: string;
  call_number: string;
  voyage_number: string;
  reported_eta: string;
  predicted_eta?: string;
  actual_pilot_arrival?: string;
  actual_berth_time?: string;
  actual_departure_time?: string;
  status: CallStatus;
  delay_risk_status: DelayRiskStatus;
  delay_risk_score: number;
  predicted_delay_hours: number;
  inbound_teu: number;
  outbound_teu: number;
  data_status: DataStatus;
  source_name: string;
  vessel?: VesselRead;
}

export interface VesselTrackResponse {
  call_id: string;
  vessel_name: string;
  call_number: string;
  status: CallStatus;
  reported_eta: string;
  predicted_eta?: string;
  predicted_delay_hours: number;
  positions: VesselPositionRead[];
}

// Equipment
export interface EquipmentRead {
  id: string;
  terminal_id: string;
  code: string;
  equipment_type: EquipmentType;
  status: EquipmentStatus;
  rated_capacity_tonnes: number;
  rated_moves_per_hour: number;
  assigned_berth_id?: string;
  data_status: DataStatus;
  source_name: string;
}

export interface EquipmentTelemetryRead {
  id: string;
  equipment_id: string;
  timestamp: string;
  moves_per_hour_actual: number;
  power_consumption_kwh: number;
  operating_hours_total: number;
  trolley_position_m?: number;
  hoist_speed_mps?: number;
  active_load_tonnes?: number;
  fault_code?: string;
  data_status: DataStatus;
}

// Yard
export type MovementType =
  | "DISCHARGE_TO_YARD"
  | "YARD_TO_GATE"
  | "GATE_TO_YARD"
  | "YARD_TO_VESSEL"
  | "HOUSEKEEPING_SHIFT";

export interface ExplanatoryFactor {
  factor: string;
  impact_teu: number;
  direction: string;
  description: string;
}

export interface ForecastHorizonDetail {
  horizon_hrs: number;
  predicted_occupied_teu: number;
  predicted_occupancy_pct: number;
  risk_tier: YardRiskTier;
  confidence_lower_pct: number;
  confidence_upper_pct: number;
  overflow_risk: boolean;
  capped_at_capacity: boolean;
  explanatory_factors: ExplanatoryFactor[];
}

export interface YardBlockRead {
  id: string;
  terminal_id: string;
  code: string;
  name: string;
  zone: YardZone;
  teu_capacity: number;
  warning_threshold_pct: number;
  critical_threshold_pct: number;
  data_status: DataStatus;
  source_name: string;
}

export interface YardBlockStatusRead {
  id: string;
  terminal_id: string;
  code: string;
  name: string;
  zone: YardZone;
  teu_capacity: number;
  warning_threshold_pct: number;
  critical_threshold_pct: number;
  current_occupied_teu: number;
  current_occupancy_pct: number;
  current_risk_tier: YardRiskTier;
  reefer_occupied_count: number;
  forecast_6h: ForecastHorizonDetail;
  forecast_12h: ForecastHorizonDetail;
  forecast_24h: ForecastHorizonDetail;
  data_status: DataStatus;
  source_name: string;
  last_observation_time?: string | null;
}

export interface YardSummaryResponse {
  terminal_id: string;
  total_capacity_teu: number;
  total_occupied_teu: number;
  overall_occupancy_pct: number;
  blocks_normal_count: number;
  blocks_watch_count: number;
  blocks_high_risk_count: number;
  blocks: YardBlockStatusRead[];
  model_metadata: Record<string, any>;
  data_status: DataStatus;
  timestamp: string;
}

export interface YardOccupancyRead {
  id: string;
  yard_block_id: string;
  timestamp: string;
  occupied_teu: number;
  occupancy_pct: number;
  reefer_occupied_count: number;
  risk_tier: YardRiskTier;
  forecast_horizon_hrs?: number;
  data_status: DataStatus;
}

export interface ContainerMovementRead {
  id: string;
  yard_block_id: string;
  timestamp: string;
  movement_type: MovementType;
  teu_count: number;
  vessel_call_id?: string | null;
  equipment_id?: string | null;
  data_status: DataStatus;
  source_name: string;
}

export interface YardBlockDetailResponse {
  block: YardBlockRead;
  current_status: YardBlockStatusRead;
  history_observations: YardOccupancyRead[];
  recent_movements: ContainerMovementRead[];
  model_metadata: Record<string, any>;
  data_status: DataStatus;
}

export interface YardCongestionAlert {
  block_id: string;
  block_code: string;
  zone: YardZone;
  current_pct: number;
  peak_forecast_pct: number;
  peak_horizon_hrs: number;
  risk_tier: YardRiskTier;
  title: string;
  message: string;
  recommended_action: string;
  data_status: DataStatus;
}

// Operations & KPIs
export interface OperationalEventRead {
  id: string;
  terminal_id: string;
  timestamp: string;
  event_type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  payload_json: Record<string, unknown>;
  data_status: DataStatus;
  source_name: string;
}

export interface BaselineKPIsResponse {
  terminal_id: string;
  terminal_code: string;
  timestamp: string;
  vessels_in_system: number;
  vessels_at_berth: number;
  vessels_in_queue: number;
  berth_occupancy_pct: number;
  total_berths: number;
  occupied_berths: number;
  active_alerts_count: number;
  yard_blocks_above_warning: number;
  mean_anchorage_delay_hours: number;
  data_status: DataStatus;
}

export interface ProvenanceSummaryResponse {
  total_data_sources: number;
  total_imported_datasets: number;
  data_status_breakdown: Record<string, number>;
  active_data_policy: string;
  disclaimer: string;
}

// Machine Learning & Model Centre
export interface ModelMetadataResponse {
  model_name: string;
  model_version: string;
  trained_at: string;
  random_seed: number;
  n_train_samples: number;
  n_test_samples: number;
  feature_columns: string[];
  operational_notice: string;
  data_status: DataStatus;
}

export interface ModelMetricsResponse {
  regression_metrics: {
    model_type: string;
    mae_hours: number;
    rmse_hours: number;
    r2_score: number;
    baseline_median_mae_hours: number;
    mae_improvement_pct: number;
    beats_baseline: boolean;
  };
  classification_metrics: {
    model_type: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    baseline_accuracy: number;
    confusion_matrix: {
      tn: number;
      fp: number;
      fn: number;
      tp: number;
    };
    beats_baseline: boolean;
  };
  feature_importances: Record<string, number>;
  target_definitions: {
    regression_target: string;
    classification_target: string;
    high_risk_threshold_hours: number;
  };
}

export interface VesselPredictionInput {
  vessel_type: VesselType;
  distance_to_pilot_nm: number;
  speed_knots: number;
  scheduled_hour_of_day: number;
  anchorage_queue_count: number;
  berth_occupancy_ratio: number;
  wind_speed_knots: number;
  visibility_nm: number;
  is_monsoon_season: boolean;
  tidal_window_favorable: boolean;
  carrier_historical_delay_mean: number;
}

export interface VesselPredictionOutput {
  predicted_delay_hours: number;
  is_delayed_high_risk: boolean;
  delay_risk_probability: number;
  delay_risk_tier: DelayRiskStatus;
  high_risk_threshold_hours: number;
  model_name: string;
  model_version: string;
  created_at: string;
  data_status: DataStatus;
  operational_notice: string;
}

// Berth Planner & Optimizer
export type SolverStatus = "OPTIMAL" | "FEASIBLE" | "INFEASIBLE" | "MODEL_INVALID" | "UNKNOWN";

export interface ScheduledAssignment {
  vessel_call_id: string;
  vessel_name: string;
  call_number: string;
  berth_id: string;
  berth_code: string;
  berth_name: string;
  scheduled_start: string;
  scheduled_end: string;
  service_duration_hours: number;
  waiting_time_hours: number;
  assigned_quay_start_m: number;
  assigned_quay_end_m: number;
  is_feasible: boolean;
  assignment_explanation: string;
  data_status: DataStatus;
}

export interface ConstraintViolation {
  violation_type: string;
  vessel_call_id: string;
  berth_id: string;
  description: string;
  severity: string;
}

export interface FeasibilityValidationResult {
  is_feasible: boolean;
  total_assignments_checked: number;
  violations_count: number;
  violations: ConstraintViolation[];
  summary: string;
  validator_name: string;
}

export interface ScheduleComparisonMetrics {
  baseline_total_waiting_hours: number;
  optimized_total_waiting_hours: number;
  waiting_hours_saved: number;
  waiting_time_reduction_pct: number;
  berth_utilization_pct: number;
  vessels_scheduled_count: number;
  vessels_unassigned_count: number;
}

export interface OptimizerResponse {
  solver_status: SolverStatus;
  solve_time_ms: number;
  objective_value?: number;
  planning_start: string;
  planning_end: string;
  baseline_schedule: ScheduledAssignment[];
  optimized_schedule: ScheduledAssignment[];
  unassigned_vessels: string[];
  feasibility_validation: FeasibilityValidationResult;
  comparison_metrics: ScheduleComparisonMetrics;
  infeasibility_diagnostics: string[];
  operational_notice: string;
  data_status: DataStatus;
}

export interface ProposeScheduleResponse {
  proposal_id: string;
  status: string;
  created_at: string;
  records_created: number;
  message: string;
  data_status: DataStatus;
}

// SimPy Scenario Simulation & Decision Lab
export interface TimeSeriesSample {
  hour: number;
  timestamp_iso: string;
  value: number;
}

export interface VesselSimulationLog {
  vessel_id: string;
  vessel_name: string;
  call_number: string;
  arrival_hour: number;
  berth_hour?: number;
  departure_hour?: number;
  waiting_time_hours: number;
  service_duration_hours: number;
  status: string;
}

export interface SimulationMetrics {
  mean_waiting_time_hours: number;
  median_waiting_time_hours: number;
  p90_waiting_time_hours: number;
  total_waiting_hours: number;
  berth_utilization_pct: number;
  crane_utilization_pct: number;
  vessels_served_count: number;
  vessels_remaining_queue: number;
  estimated_secondary_co2_tonnes: number;
}

export interface ScenarioParameters {
  scenario_code: string;
  scenario_name: string;
  description?: string;
  is_baseline: boolean;
  random_seed: number;
  duration_hours: number;
  vessel_arrival_multiplier: number;
  berth_outage_count: number;
  crane_outage_count: number;
  crane_service_rate_multiplier: number;
  weather_disruption_factor: number;
  yard_congestion_threshold_pct: number;
}

export interface SimulationRunResponse {
  run_id: string;
  scenario_code: string;
  scenario_name: string;
  is_baseline: boolean;
  random_seed: number;
  duration_hours: number;
  parameters: ScenarioParameters;
  metrics: SimulationMetrics;
  queue_length_series: TimeSeriesSample[];
  berth_occupancy_series: TimeSeriesSample[];
  vessel_logs: VesselSimulationLog[];
  methodology_notes: string[];
  data_status: DataStatus;
  operational_notice: string;
}

export interface MetricDelta {
  baseline_value: number;
  alternative_value: number;
  absolute_delta: number;
  percentage_delta: number;
}

export interface ScenarioComparisonResponse {
  baseline_run: SimulationRunResponse;
  alternative_runs: SimulationRunResponse[];
  comparisons: Record<string, Record<string, MetricDelta>>;
  trade_off_summary: string[];
  operational_notice: string;
  data_status: DataStatus;
}

export interface ProposeScenarioResponse {
  proposal_id: string;
  status: string;
  created_at: string;
  message: string;
  data_status: DataStatus;
}

// Green Port & Sustainability
export type PollutantType = "CO2E" | "SOX" | "NOX" | "PM25";
export type ActivityType =
  | "VESSEL_HOTELING_AUX_ENGINE"
  | "VESSEL_MANEUVERING"
  | "STS_CRANE_ELECTRIC"
  | "YARD_EQUIPMENT_DIESEL";
export type FactorStatus = "VERIFIED_SOURCE" | "ILLUSTRATIVE_ASSUMPTION" | "UNCONFIGURED";

export interface EmissionFactorRead {
  id: string;
  pollutant: PollutantType;
  activity_type: ActivityType;
  factor_value: number;
  factor_unit: string;
  source_reference: string;
  source_url?: string | null;
  publication_date?: string | null;
  scope_category?: string | null;
  applicability_notes?: string | null;
  is_illustrative_assumption: boolean;
  factor_status: FactorStatus;
  data_status: DataStatus;
}

export interface ActivityEmissionsEstimate {
  activity_type: ActivityType;
  activity_name: string;
  scope_category: string;
  activity_quantity: number;
  activity_unit: string;
  pollutant: PollutantType;
  factor_id?: string | null;
  factor_value?: number | null;
  factor_unit?: string | null;
  factor_status?: string | null;
  source_reference?: string | null;
  source_url?: string | null;
  estimated_kg?: number | null;
  estimated_mt?: number | null;
  formula_expression: string;
  is_configured: boolean;
  applicability_note?: string | null;
}

export interface PollutantBreakdown {
  pollutant: PollutantType;
  pollutant_name: string;
  unit: string;
  total_kg: number;
  total_mt: number;
  activities: ActivityEmissionsEstimate[];
}

export interface ActivityDelta {
  activity_type: ActivityType;
  activity_name: string;
  scope_category: string;
  baseline_quantity: number;
  comparison_quantity: number;
  quantity_unit: string;
  baseline_kg: number;
  comparison_kg: number;
  delta_kg: number;
  delta_pct: number;
  formula_expression: string;
}

export interface ScenarioEmissionsComparison {
  baseline_scenario_code: string;
  baseline_scenario_name: string;
  comparison_scenario_code: string;
  comparison_scenario_name: string;
  duration_hours: number;
  factor_set_id: string;
  factor_count: number;
  comparison_integrity_verified: boolean;
  scope_boundary_note: string;
  baseline_total_co2e_kg: number;
  comparison_total_co2e_kg: number;
  delta_co2e_kg: number;
  delta_co2e_pct: number;
  baseline_total_co2e_mt: number;
  comparison_total_co2e_mt: number;
  delta_co2e_mt: number;
  activity_deltas: ActivityDelta[];
  calculation_method: string;
  disclaimer: string;
}

export interface EnvironmentalContext {
  station_name: string;
  observation_time: string;
  temperature_celsius: number;
  wind_speed_knots: number;
  wind_direction: string;
  tidal_height_m: number;
  tide_phase: string;
  air_quality_index: number;
  air_quality_tier: string;
  pm25_ug_m3: number;
  navigational_use_prohibited_notice: string;
  data_status: DataStatus;
}

export interface ScopeBoundaryDefinition {
  terminal_complex: string;
  scope_1_included: string[];
  scope_2_included: string[];
  scope_3_included: string[];
  explicitly_excluded: string[];
  methodology_framework: string;
}

export interface GreenPortOverviewResponse {
  terminal_id: string;
  reporting_period_hours: number;
  scope_definition: ScopeBoundaryDefinition;
  total_co2e_mt: number;
  total_co2e_kg: number;
  pollutant_summaries: PollutantBreakdown[];
  factors: EmissionFactorRead[];
  baseline_comparison: ScenarioEmissionsComparison;
  environmental_context: EnvironmentalContext;
  data_status: DataStatus;
  timestamp: string;
}
