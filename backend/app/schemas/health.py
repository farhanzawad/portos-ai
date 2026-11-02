from datetime import datetime, timezone
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Health check response schema."""

    status: str = Field(default="ok", description="Overall service status")
    service: str = Field(default="portos-backend", description="Service identifier")
    version: str = Field(..., description="Service version string")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Current server timestamp in UTC",
    )
    demo_mode: bool = Field(..., description="Whether system is running in demo mode")
    environment: str = Field(..., description="Application environment (development/production)")


class SystemStatusResponse(BaseModel):
    """Detailed system status schema."""

    service: str = "portos-backend"
    version: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    demo_mode: bool
    environment: str
    timezone: str
    gemini_status: str = Field(
        ...,
        description="'configured' if GEMINI_API_KEY is present, otherwise 'offline_demo_mode'",
    )
    database_configured: bool = Field(
        ...,
        description="Whether a database URL is present in configuration",
    )
    data_status: str = Field(
        default="SIMULATED",
        description="Default operational record classification",
    )


class SecurityAuditRead(BaseModel):
    """Security controls and compliance verification status."""

    secrets_isolated_server_side: bool = Field(default=True, description="Secrets kept in server environment")
    cors_restricted: bool = Field(default=True, description="CORS restricted to configured origins")
    cors_allowed_origins: list[str] = Field(default_factory=list, description="Explicitly allowed origins")
    traceback_masked_in_responses: bool = Field(default=True, description="Tracebacks concealed from HTTP errors")
    file_upload_max_size_bytes: int = Field(default=10485760, description="Enforced upload ceiling (10 MB)")
    file_upload_allowed_extensions: list[str] = Field(default_factory=lambda: [".csv", ".xlsx", ".pdf"])
    file_signature_validation_enforced: bool = Field(default=True, description="Magic byte signature verification")
    formula_injection_defense_active: bool = Field(default=True, description="Spreadsheet formula neutralization")
    path_traversal_sanitization_active: bool = Field(default=True, description="Path traversal stripping on uploads")
    sql_parameterization_enforced: bool = Field(default=True, description="All API endpoints use ORM parameterization")
    prompt_injection_guard_active: bool = Field(default=True, description="Adversarial prompt injection detection active")
    physical_equipment_control_permitted: bool = Field(default=False, description="Strict refusal: no physical crane control")
    navigational_clearance_issuance_permitted: bool = Field(default=False, description="Strict refusal: no navigational clearance")


class ResponsibleAIAuditRead(BaseModel):
    """Responsible-AI governance and operational truthfulness indicators."""

    data_status_policy: str = Field(default="DATA-POL-001 (5-Tier Status Tagging)")
    cpa_live_connection_active: bool = Field(default=False, description="Explicit: no live CPA TOS integration")
    synthetic_data_limitations_prominent: bool = Field(default=True, description="Disclaimers surfaced across UI and API")
    human_in_the_loop_required: bool = Field(default=True, description="Human review mandatory for berth schedule approval")
    tool_allowlist_count: int = Field(default=10, description="Count of allowlisted copilot analytical tools")
    separation_of_analytical_roles_enforced: bool = Field(default=True, description="Deterministic solvers separate from LLM")
    models_deployed: dict[str, str] = Field(default_factory=dict, description="Deployed ML and optimization models")


class SubsystemStatusRead(BaseModel):
    """Operational readiness of internal subsystems."""

    database: str = Field(default="healthy")
    event_stream_bus: str = Field(default="healthy")
    simulation_engine: str = Field(default="ready")
    optimizer_engine: str = Field(default="ready")
    ml_pipeline: str = Field(default="ready")


class SystemAuditSummaryResponse(BaseModel):
    """Consolidated technical QA, security and Responsible-AI compliance report."""

    service: str = "portos-backend"
    version: str
    environment: str
    compliance_verdict: str = Field(default="PASS", description="Overall QA verdict: PASS or FAIL")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    security: SecurityAuditRead
    responsible_ai: ResponsibleAIAuditRead
    subsystems: SubsystemStatusRead


