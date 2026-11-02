import {
  BaselineKPIsResponse,
  TerminalLayoutRead,
  TerminalRead,
  BerthRead,
  VesselCallRead,
  VesselTrackResponse,
  VesselRead,
  PaginatedResponse,
  OperationalEventRead,
  YardBlockRead,
  YardSummaryResponse,
  YardBlockDetailResponse,
  YardCongestionAlert,
  EquipmentRead,
  ProvenanceSummaryResponse,
  ModelMetadataResponse,
  ModelMetricsResponse,
  VesselPredictionInput,
  VesselPredictionOutput,
  GreenPortOverviewResponse,
  EmissionFactorRead,
  ScenarioEmissionsComparison,
  EnvironmentalContext,
  ImportedDatasetRead,
  ImportedRecordRead,
  DocumentUploadResponse,
  DataSourceRead,
  ImportSummaryReport,
  RecordCorrectionRequest,
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotStatusResponse,
  CopilotSuggestedPrompt,
  EventMessage,
  IncidentPreset,
  IncidentInjectionRequest,
  IncidentInjectionResponse,
  IncidentResetResponse,
  EventStreamStatus,
  WeatherContextRead,
  WeatherForecastResponse,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) errorDetail = errorJson.detail;
      } catch {
        // Fallback to HTTP text
      }
      throw new Error(errorDetail);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error("Network request failed. Is the backend server running?");
  }
}

export async function getOverviewKPIs(terminalId?: string): Promise<BaselineKPIsResponse> {
  const query = terminalId ? `?terminal_id=${encodeURIComponent(terminalId)}` : "";
  return fetchFromApi<BaselineKPIsResponse>(`/api/v1/kpis/overview${query}`);
}

export async function getTerminals(): Promise<TerminalRead[]> {
  return fetchFromApi<TerminalRead[]>("/api/v1/terminals");
}

export async function getTerminalLayout(terminalId: string): Promise<TerminalLayoutRead> {
  return fetchFromApi<TerminalLayoutRead>(`/api/v1/terminals/${encodeURIComponent(terminalId)}/layout`);
}

export async function getBerths(terminalId?: string): Promise<BerthRead[]> {
  const query = terminalId ? `?terminal_id=${encodeURIComponent(terminalId)}` : "";
  return fetchFromApi<BerthRead[]>(`/api/v1/berths${query}`);
}

export async function getVesselCalls(params?: {
  page?: number;
  pageSize?: number;
  status?: string;
  delayRiskStatus?: string;
}): Promise<PaginatedResponse<VesselCallRead>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));
  if (params?.status) query.set("status", params.status);
  if (params?.delayRiskStatus) query.set("delay_risk_status", params.delayRiskStatus);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return fetchFromApi<PaginatedResponse<VesselCallRead>>(`/api/v1/vessels/calls${qs}`);
}

export async function getVesselTrack(callId: string): Promise<VesselTrackResponse> {
  return fetchFromApi<VesselTrackResponse>(`/api/v1/vessels/calls/${encodeURIComponent(callId)}/track`);
}

export async function getVessels(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<PaginatedResponse<VesselRead>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));
  if (params?.search) query.set("search", params.search);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return fetchFromApi<PaginatedResponse<VesselRead>>(`/api/v1/vessels${qs}`);
}

export async function getOperationalEvents(params?: {
  page?: number;
  pageSize?: number;
  severity?: string;
}): Promise<PaginatedResponse<OperationalEventRead>> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("page_size", String(params.pageSize));
  if (params?.severity) query.set("severity", params.severity);

  const qs = query.toString() ? `?${query.toString()}` : "";
  return fetchFromApi<PaginatedResponse<OperationalEventRead>>(`/api/v1/events${qs}`);
}

export async function getYardBlocks(): Promise<YardBlockRead[]> {
  return fetchFromApi<YardBlockRead[]>("/api/v1/yard/blocks");
}

export async function getYardStatus(terminalId?: string): Promise<YardSummaryResponse> {
  const query = terminalId ? `?terminal_id=${encodeURIComponent(terminalId)}` : "";
  return fetchFromApi<YardSummaryResponse>(`/api/v1/yard/status${query}`);
}

export async function getYardForecast(horizonHrs: number = 6, blockId?: string): Promise<any> {
  let query = `?horizon_hrs=${horizonHrs}`;
  if (blockId) query += `&block_id=${encodeURIComponent(blockId)}`;
  return fetchFromApi<any>(`/api/v1/yard/forecast${query}`);
}

export async function getYardBlockDetail(blockId: string): Promise<YardBlockDetailResponse> {
  return fetchFromApi<YardBlockDetailResponse>(`/api/v1/yard/blocks/${encodeURIComponent(blockId)}/detail`);
}

export async function getYardCongestionAlerts(): Promise<YardCongestionAlert[]> {
  return fetchFromApi<YardCongestionAlert[]>("/api/v1/yard/congestion-alerts");
}

export async function getEquipment(equipmentType?: string): Promise<EquipmentRead[]> {
  const query = equipmentType ? `?equipment_type=${encodeURIComponent(equipmentType)}` : "";
  return fetchFromApi<EquipmentRead[]>(`/api/v1/equipment${query}`);
}

export async function getProvenanceSummary(): Promise<ProvenanceSummaryResponse> {
  return fetchFromApi<ProvenanceSummaryResponse>("/api/v1/provenance/summary");
}

export async function getModelMetadata(): Promise<ModelMetadataResponse> {
  return fetchFromApi<ModelMetadataResponse>("/api/v1/models/metadata");
}

export async function getModelEvaluation(): Promise<ModelMetricsResponse> {
  return fetchFromApi<ModelMetricsResponse>("/api/v1/models/evaluation");
}

export async function predictVesselDelay(
  input: VesselPredictionInput
): Promise<VesselPredictionOutput> {
  return fetchFromApi<VesselPredictionOutput>("/api/v1/models/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

// Sustainability & Green Port Analytics
export async function getGreenPortOverview(
  terminalId?: string,
  periodHours?: number
): Promise<GreenPortOverviewResponse> {
  const params = new URLSearchParams();
  if (terminalId) params.append("terminal_id", terminalId);
  if (periodHours) params.append("period_hours", periodHours.toString());
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchFromApi<GreenPortOverviewResponse>(`/api/v1/sustainability/overview${qs}`);
}

export async function getEmissionFactors(
  pollutant?: string,
  activityType?: string
): Promise<EmissionFactorRead[]> {
  const params = new URLSearchParams();
  if (pollutant) params.append("pollutant", pollutant);
  if (activityType) params.append("activity_type", activityType);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return fetchFromApi<EmissionFactorRead[]>(`/api/v1/sustainability/factors${qs}`);
}

export async function getScenarioEmissionsComparison(
  scenarioCode: string = "monsoon_weather_squall"
): Promise<ScenarioEmissionsComparison> {
  const query = `?scenario_code=${encodeURIComponent(scenarioCode)}`;
  return fetchFromApi<ScenarioEmissionsComparison>(`/api/v1/sustainability/compare${query}`);
}

export async function getEnvironmentalContext(): Promise<EnvironmentalContext> {
  return fetchFromApi<EnvironmentalContext>("/api/v1/sustainability/environmental-context");
}

// ==========================================
// Optional A: External Weather & Maritime Environment API
// ==========================================

export async function getCurrentWeather(refresh: boolean = false): Promise<WeatherContextRead> {
  const query = refresh ? "?refresh=true" : "";
  return fetchFromApi<WeatherContextRead>(`/api/v1/weather/current${query}`);
}

export async function getWeatherForecast(
  hours: number = 24,
  refresh: boolean = false
): Promise<WeatherForecastResponse> {
  const query = `?hours=${hours}${refresh ? "&refresh=true" : ""}`;
  return fetchFromApi<WeatherForecastResponse>(`/api/v1/weather/forecast${query}`);
}

// ==========================================
// Milestone 13: Port Data Bridge Ingestion API
// ==========================================

export async function uploadDocument(
  file: File,
  dataSourceId?: string,
  documentType: string = "VESSEL_BERTHING_LOG"
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (dataSourceId) formData.append("data_source_id", dataSourceId);
  formData.append("document_type", documentType);

  const url = `${API_BASE_URL}/api/v1/ingestion/upload`;
  const response = await fetch(url, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Upload failed (${response.status})`;
    try {
      const json = await response.json();
      if (json.detail) errorDetail = json.detail;
    } catch {
      // Fallback
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export async function listDatasets(limit: number = 20): Promise<ImportedDatasetRead[]> {
  return fetchFromApi<ImportedDatasetRead[]>(`/api/v1/ingestion/datasets?limit=${limit}`);
}

export async function getDataset(datasetId: string): Promise<ImportedDatasetRead> {
  return fetchFromApi<ImportedDatasetRead>(`/api/v1/ingestion/datasets/${encodeURIComponent(datasetId)}`);
}

export async function correctRecord(
  datasetId: string,
  recordId: string,
  updatedFields: Record<string, any>,
  isAccepted?: boolean,
  rejectionReason?: string
): Promise<ImportedRecordRead> {
  return fetchFromApi<ImportedRecordRead>(
    `/api/v1/ingestion/datasets/${encodeURIComponent(datasetId)}/records/${encodeURIComponent(recordId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        row_id: recordId,
        updated_fields: updatedFields,
        is_accepted: isAccepted,
        rejection_reason: rejectionReason,
      }),
    }
  );
}

export async function commitDataset(
  datasetId: string,
  reviewerName: string,
  operatorNotes?: string,
  corrections?: RecordCorrectionRequest[]
): Promise<ImportSummaryReport> {
  return fetchFromApi<ImportSummaryReport>(
    `/api/v1/ingestion/datasets/${encodeURIComponent(datasetId)}/commit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataset_id: datasetId,
        reviewer_name: reviewerName,
        operator_notes: operatorNotes,
        corrections,
      }),
    }
  );
}

export async function listDataSources(): Promise<DataSourceRead[]> {
  return fetchFromApi<DataSourceRead[]>("/api/v1/ingestion/sources");
}

export function getDownloadCsvTemplateUrl(): string {
  return `${API_BASE_URL}/api/v1/ingestion/templates/csv`;
}

export function getDownloadXlsxTemplateUrl(): string {
  return `${API_BASE_URL}/api/v1/ingestion/templates/xlsx`;
}

// Milestone 14: Copilot API Functions
export async function sendCopilotMessage(
  request: CopilotChatRequest
): Promise<CopilotChatResponse> {
  return fetchFromApi<CopilotChatResponse>("/api/v1/copilot/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function getCopilotStatus(): Promise<CopilotStatusResponse> {
  return fetchFromApi<CopilotStatusResponse>("/api/v1/copilot/status");
}

export async function getCopilotPrompts(): Promise<CopilotSuggestedPrompt[]> {
  return fetchFromApi<CopilotSuggestedPrompt[]>("/api/v1/copilot/prompts");
}

// Milestone 15: Event Stream & Workflow Sync
export function getEventStreamUrl(lastEventId?: string): string {
  const url = `${API_BASE_URL}/api/v1/events/stream`;
  return lastEventId ? `${url}?last_event_id=${encodeURIComponent(lastEventId)}` : url;
}

export async function getEventHistory(
  limit: number = 50,
  sinceId?: string
): Promise<EventMessage[]> {
  const query = new URLSearchParams({ limit: String(limit) });
  if (sinceId) query.append("since_id", sinceId);
  return fetchFromApi<EventMessage[]>(`/api/v1/events/history?${query.toString()}`);
}

export async function getEventStreamStatus(): Promise<EventStreamStatus> {
  return fetchFromApi<EventStreamStatus>("/api/v1/events/status");
}

export async function getIncidentPresets(): Promise<IncidentPreset[]> {
  return fetchFromApi<IncidentPreset[]>("/api/v1/events/presets");
}

export async function injectIncident(
  request: IncidentInjectionRequest
): Promise<IncidentInjectionResponse> {
  return fetchFromApi<IncidentInjectionResponse>("/api/v1/events/inject-incident", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function resetIncident(): Promise<IncidentResetResponse> {
  return fetchFromApi<IncidentResetResponse>("/api/v1/events/reset-incident", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
}




