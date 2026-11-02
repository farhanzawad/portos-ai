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
